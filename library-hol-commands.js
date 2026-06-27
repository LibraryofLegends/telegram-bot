const {
  canUseDownload,
  logUsage
} = require("./access-control");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pad2(value) {
  return String(value || 0).padStart(2, "0");
}

function parseHolCommand(text = "") {
  const parts = String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length < 2) {
    return null;
  }

  const command = parts[0].toLowerCase();

  if (command !== "!hol" && command !== "/hol") {
    return null;
  }

  // !hol movie 21
  // !hol film 21
  if (
    (parts[1]?.toLowerCase() === "movie" || parts[1]?.toLowerCase() === "film") &&
    /^\d+$/.test(parts[2] || "")
  ) {
    return {
      type: "movie",
      id: Number(parts[2])
    };
  }

  // !hol serie 1 staffel 1
  // !hol series 1 season 1
  // !hol serie 1 s1e1
  // !hol serie 1 alle
  if (
    ["serie", "series", "show"].includes(parts[1]?.toLowerCase()) &&
    /^\d+$/.test(parts[2] || "")
  ) {
    const seriesRef = Number(parts[2]);
    const rest = parts.slice(3).map((p) => p.toLowerCase());

    if (!rest.length) {
      return {
        type: "series_help",
        seriesRef
      };
    }

    if (rest[0] === "alle" || rest[0] === "all") {
      return {
        type: "series_all",
        seriesRef
      };
    }

    if (
      (rest[0] === "staffel" || rest[0] === "season") &&
      /^\d+$/.test(rest[1] || "")
    ) {
      return {
        type: "season",
        seriesRef,
        season: Number(rest[1])
      };
    }

    const sxe = String(rest[0] || "").match(/^s(\d+)e(\d+)$/i);

    if (sxe) {
      return {
        type: "episode",
        seriesRef,
        season: Number(sxe[1]),
        episode: Number(sxe[2])
      };
    }

    return {
      type: "series_help",
      seriesRef
    };
  }

  // !hol 1 staffel 1
  // !hol 1 s1e1
  // !hol 1 alle
  if (/^\d+$/.test(parts[1] || "")) {
    const id = Number(parts[1]);
    const rest = parts.slice(2).map((p) => p.toLowerCase());

    if (
      rest.length >= 2 &&
      (rest[0] === "staffel" || rest[0] === "season") &&
      /^\d+$/.test(rest[1] || "")
    ) {
      return {
        type: "season",
        seriesRef: id,
        season: Number(rest[1])
      };
    }

    if (rest[0] === "alle" || rest[0] === "all") {
      return {
        type: "series_all",
        seriesRef: id
      };
    }

    const sxe = String(rest[0] || "").match(/^s(\d+)e(\d+)$/i);

    if (sxe) {
      return {
        type: "episode",
        seriesRef: id,
        season: Number(sxe[1]),
        episode: Number(sxe[2])
      };
    }

    // !hol 21 bleibt Film
    return {
      type: "movie",
      id
    };
  }

  return null;
}

function buildMovieCaption(movie) {
  const lines = [];

  lines.push("━━━━━━━━━━━━━━━━━━");
  lines.push(`🎬 ${String(movie.title || "Unbekannter Film").toUpperCase()}${movie.year ? ` (${movie.year})` : ""}`);
  lines.push("━━━━━━━━━━━━━━━━━━");
  lines.push("");

  const meta = [
    movie.quality,
    movie.resolution,
    movie.file_size,
    movie.runtime
  ]
    .map((v) => String(v || "").trim())
    .filter(Boolean)
    .join(" · ");

  if (meta) {
    lines.push(`🔥 ${meta}`);
  }

  if (movie.genre) {
    lines.push(`📂 ${movie.genre}`);
  }

  if (movie.rating) {
    lines.push(`⭐ ${movie.rating}`);
  }

  if (movie.library_id) {
    lines.push("");
    lines.push(`🆔 ${movie.library_id}`);
  }

  lines.push("");
  lines.push("@LibraryOfLegends");

  return lines.join("\n").slice(0, 1000);
}

function buildEpisodeCaption(ep) {
  const season = pad2(ep.season);
  const episode = pad2(ep.episode);

  const titleLine =
    ep.episode_title
      ? `📺 ${ep.series_title} · S${season}E${episode}\n${ep.episode_title}`
      : `📺 ${ep.series_title} · S${season}E${episode}`;

  const lines = [];

  lines.push("━━━━━━━━━━━━━━━━━━");
  lines.push(titleLine);
  lines.push("━━━━━━━━━━━━━━━━━━");
  lines.push("");

  if (ep.genre) {
    lines.push(`📂 ${ep.genre}`);
  }

  if (ep.rating) {
    lines.push(`⭐ ${ep.rating}`);
  }

  if (ep.overview) {
    lines.push("");
    lines.push(String(ep.overview).slice(0, 500));
  }

  lines.push("");
  lines.push(`📀 Staffel ${season} · Folge ${episode}`);
  lines.push("@LibraryOfLegends");

  return lines.join("\n").slice(0, 1000);
}

async function getMovieById(pgPool, movieId) {
  const result = await pgPool.query(
    `
    SELECT
      id,
      title,
      year,
      genre,
      rating,
      runtime,
      overview,
      file_name,
      file_id,
      telegram_message_id,
      topic_id,
      library_id,
      quality,
      resolution,
      file_size,
      source,
      audio
    FROM movies
    WHERE id = $1
    LIMIT 1;
    `,
    [movieId]
  );

  return result.rows[0] || null;
}

async function resolveSeriesBase(pgPool, seriesRef) {
  const numericRef = Number(seriesRef);

  if (!Number.isInteger(numericRef)) {
    return null;
  }

  const result = await pgPool.query(
    `
    SELECT
      id,
      series_library_id,
      series_title
    FROM series
    WHERE
      series_library_id = $1::integer
      OR id = $1::integer
    ORDER BY
      CASE WHEN series_library_id = $1::integer THEN 0 ELSE 1 END,
      season ASC,
      episode ASC
    LIMIT 1;
    `,
    [numericRef]
  );

  return result.rows[0] || null;
}

async function getEpisode(pgPool, seriesRef, season, episode) {
  const base = await resolveSeriesBase(pgPool, seriesRef);

  if (!base) {
    return null;
  }

  let result;

  if (base.series_library_id) {
    result = await pgPool.query(
  `
  SELECT
    id,
    series_title,
    season,
    episode,
    episode_title,
    genre,
    rating,
    overview,
    file_name,
    file_id,
    telegram_message_id,
    topic_id,
    series_library_id
  FROM series
  WHERE
    series_library_id = $1::integer
    AND season = $2::integer
    AND episode = $3::integer
  LIMIT 1;
  `,
  [Number(base.series_library_id), Number(season), Number(episode)]
);
  } else {
    result = await pgPool.query(
      `
      SELECT
        id,
        series_title,
        season,
        episode,
        episode_title,
        genre,
        rating,
        overview,
        file_name,
        file_id,
        telegram_message_id,
        topic_id,
        series_library_id
      FROM series
      WHERE
        LOWER(series_title) = LOWER($1)
        AND season = $2
        AND episode = $3
      LIMIT 1;
      `,
      [base.series_title, season, episode]
    );
  }

  return result.rows[0] || null;
}

async function getSeasonEpisodes(pgPool, seriesRef, season) {
  const base = await resolveSeriesBase(pgPool, seriesRef);

  if (!base) {
    return {
      base: null,
      episodes: []
    };
  }

  let result;

  if (base.series_library_id) {
    result = await pgPool.query(
  `
  SELECT
    id,
    series_title,
    season,
    episode,
    episode_title,
    genre,
    rating,
    overview,
    file_name,
    file_id,
    telegram_message_id,
    topic_id,
    series_library_id
  FROM series
  WHERE
    series_library_id = $1::integer
    AND season = $2::integer
  ORDER BY episode ASC;
  `,
  [Number(base.series_library_id), Number(season)]
);
  } else {
    result = await pgPool.query(
      `
      SELECT
        id,
        series_title,
        season,
        episode,
        episode_title,
        genre,
        rating,
        overview,
        file_name,
        file_id,
        telegram_message_id,
        topic_id,
        series_library_id
      FROM series
      WHERE
        LOWER(series_title) = LOWER($1)
        AND season = $2
      ORDER BY episode ASC;
      `,
      [base.series_title, season]
    );
  }

  return {
    base,
    episodes: result.rows || []
  };
}

async function sendMediaByFileId(bot, chatId, fileId, caption, replyToMessageId) {
  try {
    await bot.sendVideo(chatId, fileId, {
      caption,
      protect_content: true,
      reply_to_message_id: replyToMessageId
    });

    return {
      ok: true,
      method: "sendVideo"
    };
  } catch (videoErr) {
    console.error(
      "⚠️ sendVideo fehlgeschlagen, versuche sendDocument:",
      videoErr.response?.data || videoErr.message
    );
  }

  try {
    await bot.sendDocument(chatId, fileId, {
      caption,
      protect_content: true,
      reply_to_message_id: replyToMessageId
    });

    return {
      ok: true,
      method: "sendDocument"
    };
  } catch (docErr) {
    console.error(
      "❌ sendDocument fehlgeschlagen:",
      docErr.response?.data || docErr.message
    );

    return {
      ok: false,
      error: docErr.response?.data || docErr.message
    };
  }
}

async function handleMovieHol(bot, msg, pgPool, parsed) {
  const chatId = msg.chat.id;
  const from = msg.from;

  const limitCheck = await canUseDownload(pgPool, from.id, "movie");

  if (!limitCheck.ok) {
    await bot.sendMessage(chatId, limitCheck.message, {
      reply_to_message_id: msg.message_id
    });
    return true;
  }

  const movie = await getMovieById(pgPool, parsed.id);

  if (!movie) {
    await bot.sendMessage(
      chatId,
      `❌ Film-ID ${parsed.id} wurde nicht gefunden.`,
      {
        reply_to_message_id: msg.message_id
      }
    );
    return true;
  }

  if (!movie.file_id) {
    await bot.sendMessage(
      chatId,
      `⚠️ Film gefunden, aber keine file_id gespeichert.\n\n` +
        `🎬 ${movie.title || "Unbekannter Film"}\n` +
        `ID: ${movie.id}\n\n` +
        `Dieser Film muss wahrscheinlich neu/importiert werden, damit der Bot ihn senden kann.`,
      {
        reply_to_message_id: msg.message_id
      }
    );
    return true;
  }

  await bot.sendMessage(
    chatId,
    `📦 Wird vorbereitet:\n\n🎬 ${movie.title || "Unbekannter Film"}${movie.year ? ` (${movie.year})` : ""}`,
    {
      reply_to_message_id: msg.message_id
    }
  );

  const sent = await sendMediaByFileId(
    bot,
    chatId,
    movie.file_id,
    buildMovieCaption(movie),
    msg.message_id
  );

  if (!sent.ok) {
    await bot.sendMessage(
      chatId,
      "❌ Der Film konnte nicht gesendet werden.",
      {
        reply_to_message_id: msg.message_id
      }
    );
    return true;
  }

  await logUsage(pgPool, from.id, "movie", movie.id);

  await bot.sendMessage(
    chatId,
    `✅ Gesendet.\n\n` +
      `🎬 ${movie.title || "Unbekannter Film"}\n` +
      `📊 Tageslimit: ${limitCheck.remaining === "unbegrenzt" ? "unbegrenzt" : `${limitCheck.remaining - 1} übrig`}`,
    {
      reply_to_message_id: msg.message_id
    }
  );

  return true;
}

async function handleEpisodeHol(bot, msg, pgPool, parsed) {
  const chatId = msg.chat.id;
  const from = msg.from;

  const limitCheck = await canUseDownload(pgPool, from.id, "episode");

  if (!limitCheck.ok) {
    await bot.sendMessage(chatId, limitCheck.message, {
      reply_to_message_id: msg.message_id
    });
    return true;
  }

  const ep = await getEpisode(
    pgPool,
    parsed.seriesRef,
    parsed.season,
    parsed.episode
  );

  if (!ep) {
    await bot.sendMessage(
      chatId,
      `❌ Folge nicht gefunden.\n\nSerie: ${parsed.seriesRef}\nS${pad2(parsed.season)}E${pad2(parsed.episode)}`,
      {
        reply_to_message_id: msg.message_id
      }
    );
    return true;
  }

  if (!ep.file_id) {
    await bot.sendMessage(
      chatId,
      `⚠️ Folge gefunden, aber keine file_id gespeichert.\n\n` +
        `📺 ${ep.series_title} S${pad2(ep.season)}E${pad2(ep.episode)}`,
      {
        reply_to_message_id: msg.message_id
      }
    );
    return true;
  }

  await bot.sendMessage(
    chatId,
    `📦 Wird vorbereitet:\n\n📺 ${ep.series_title} S${pad2(ep.season)}E${pad2(ep.episode)}`,
    {
      reply_to_message_id: msg.message_id
    }
  );

  const sent = await sendMediaByFileId(
    bot,
    chatId,
    ep.file_id,
    buildEpisodeCaption(ep),
    msg.message_id
  );

  if (!sent.ok) {
    await bot.sendMessage(
      chatId,
      "❌ Die Folge konnte nicht gesendet werden.",
      {
        reply_to_message_id: msg.message_id
      }
    );
    return true;
  }

  await logUsage(
    pgPool,
    from.id,
    "episode",
    `${ep.series_title}-S${pad2(ep.season)}E${pad2(ep.episode)}`
  );

  await bot.sendMessage(
    chatId,
    `✅ Folge gesendet.\n\n` +
      `📺 ${ep.series_title} S${pad2(ep.season)}E${pad2(ep.episode)}`,
    {
      reply_to_message_id: msg.message_id
    }
  );

  return true;
}

async function handleSeasonHol(bot, msg, pgPool, parsed) {
  const chatId = msg.chat.id;
  const from = msg.from;

  const limitCheck = await canUseDownload(pgPool, from.id, "season");

  if (!limitCheck.ok) {
    await bot.sendMessage(chatId, limitCheck.message, {
      reply_to_message_id: msg.message_id
    });
    return true;
  }

  const { base, episodes } = await getSeasonEpisodes(
    pgPool,
    parsed.seriesRef,
    parsed.season
  );

  if (!base) {
    await bot.sendMessage(
      chatId,
      `❌ Serie ${parsed.seriesRef} wurde nicht gefunden.`,
      {
        reply_to_message_id: msg.message_id
      }
    );
    return true;
  }

  if (!episodes.length) {
    await bot.sendMessage(
      chatId,
      `❌ Keine Folgen gefunden.\n\n📺 ${base.series_title}\n📀 Staffel ${parsed.season}`,
      {
        reply_to_message_id: msg.message_id
      }
    );
    return true;
  }

  await bot.sendMessage(
    chatId,
    `📦 Staffel wird vorbereitet:\n\n` +
      `📺 ${base.series_title}\n` +
      `📀 Staffel ${pad2(parsed.season)}\n` +
      `🎞 Folgen: ${episodes.length}`,
    {
      reply_to_message_id: msg.message_id
    }
  );

  let sentCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  for (const ep of episodes) {
    if (!ep.file_id) {
      skippedCount += 1;
      continue;
    }

    const sent = await sendMediaByFileId(
      bot,
      chatId,
      ep.file_id,
      buildEpisodeCaption(ep),
      msg.message_id
    );

    if (sent.ok) {
      sentCount += 1;
    } else {
      failedCount += 1;
    }

    // Kleiner Schutz gegen Telegram-Flooding
    await sleep(1200);
  }

  if (sentCount > 0) {
    await logUsage(
      pgPool,
      from.id,
      "season",
      `${base.series_title}-S${pad2(parsed.season)}`
    );
  }

  await bot.sendMessage(
    chatId,
    `✅ Staffel abgeschlossen.\n\n` +
      `📺 ${base.series_title}\n` +
      `📀 Staffel ${pad2(parsed.season)}\n\n` +
      `✅ Gesendet: ${sentCount}\n` +
      `⚠️ Ohne file_id übersprungen: ${skippedCount}\n` +
      `❌ Fehlgeschlagen: ${failedCount}\n\n` +
      `📊 Tageslimit: ${limitCheck.remaining === "unbegrenzt" ? "unbegrenzt" : `${limitCheck.remaining - 1} Staffel(n) übrig`}`,
    {
      reply_to_message_id: msg.message_id
    }
  );

  return true;
}

async function handleSeriesHelp(bot, msg, parsed) {
  await bot.sendMessage(
    msg.chat.id,
    `📺 Serien-Holen\n\n` +
      `Nutze zum Beispiel:\n\n` +
      `!hol serie ${parsed.seriesRef} staffel 1\n` +
      `!hol serie ${parsed.seriesRef} s1e1\n\n` +
      `Komplette Serien mit "alle" sind aktuell deaktiviert.`,
    {
      reply_to_message_id: msg.message_id
    }
  );

  return true;
}

async function handleSeriesAllBlocked(bot, msg) {
  await bot.sendMessage(
    msg.chat.id,
    "⛔ Ganze Serien sind aktuell nicht automatisch freigegeben.\n\n" +
      "Bitte nutze stattdessen:\n\n" +
      "!hol serie ID staffel 1\n" +
      "oder\n" +
      "!hol serie ID s1e1",
    {
      reply_to_message_id: msg.message_id
    }
  );

  return true;
}

async function handleLibraryHolCommands(bot, msg, pgPool) {
  const text = msg.text || "";
  const from = msg.from;

  if (!from) return false;

  const parsed = parseHolCommand(text);

  if (!parsed) {
    return false;
  }

  if (parsed.type === "movie") {
    return await handleMovieHol(bot, msg, pgPool, parsed);
  }

  if (parsed.type === "episode") {
    return await handleEpisodeHol(bot, msg, pgPool, parsed);
  }

  if (parsed.type === "season") {
    return await handleSeasonHol(bot, msg, pgPool, parsed);
  }

  if (parsed.type === "series_help") {
    return await handleSeriesHelp(bot, msg, parsed);
  }

  if (parsed.type === "series_all") {
    return await handleSeriesAllBlocked(bot, msg);
  }

  return false;
}

module.exports = {
  handleLibraryHolCommands
};