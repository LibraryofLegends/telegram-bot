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

function parseSeriesAction(seriesRef, restParts = []) {
  const rest = restParts.map((p) => String(p || "").toLowerCase());

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

function parseSeriesTitleCommand(bodyParts = []) {
  const lower = bodyParts.map((p) => String(p || "").toLowerCase());

  const sxeIndex = lower.findIndex((p) => /^s\d+e\d+$/i.test(p));

  if (sxeIndex > 0) {
    const title = bodyParts.slice(0, sxeIndex).join(" ").trim();
    const sxe = lower[sxeIndex].match(/^s(\d+)e(\d+)$/i);

    if (title && sxe) {
      return {
        type: "episode",
        seriesRef: title,
        season: Number(sxe[1]),
        episode: Number(sxe[2])
      };
    }
  }

  const seasonIndex = lower.findIndex((p) => p === "staffel" || p === "season");

  if (
    seasonIndex > 0 &&
    /^\d+$/.test(lower[seasonIndex + 1] || "")
  ) {
    const title = bodyParts.slice(0, seasonIndex).join(" ").trim();

    if (title) {
      return {
        type: "season",
        seriesRef: title,
        season: Number(lower[seasonIndex + 1])
      };
    }
  }

  return null;
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

  // =============================
  // !hol movie 21
  // !hol film LIB-ACT-0001
  // !hol movie oblivion
  // =============================
  if (
    parts[1]?.toLowerCase() === "movie" ||
    parts[1]?.toLowerCase() === "film"
  ) {
    const movieRef = parts.slice(2).join(" ").trim();

    if (!movieRef) {
      return null;
    }

    return {
      type: "movie",
      id: movieRef
    };
  }

  // =============================
  // !hol serie 1 staffel 1
  // !hol serie 1 s1e1
  // !hol serie tulsa king staffel 1
  // !hol serie tulsa king s1e1
  // =============================
  if (["serie", "series", "show"].includes(parts[1]?.toLowerCase())) {
    const body = parts.slice(2);

    if (!body.length) {
      return null;
    }

    if (/^\d+$/.test(body[0] || "")) {
      return parseSeriesAction(Number(body[0]), body.slice(1));
    }

    const parsedByTitle = parseSeriesTitleCommand(body);

    if (parsedByTitle) {
      return parsedByTitle;
    }

    return {
      type: "series_help",
      seriesRef: body.join(" ").trim()
    };
  }

  // =============================
  // !hol 1 staffel 1
  // !hol 1 s1e1
  // !hol 1 alle
  // =============================
  if (/^\d+$/.test(parts[1] || "")) {
    const id = Number(parts[1]);
    const rest = parts.slice(2);

    if (rest.length) {
      return parseSeriesAction(id, rest);
    }

    // !hol 21 bleibt Film
    return {
      type: "movie",
      id
    };
  }

  // =============================
  // !hol tulsa king s1e1
  // !hol tulsa king staffel 1
  // =============================
  const parsedSeriesTitle = parseSeriesTitleCommand(parts.slice(1));

  if (parsedSeriesTitle) {
    return parsedSeriesTitle;
  }

  // =============================
  // !hol LIB-ACT-0001
  // !hol oblivion
  // =============================
  const movieRef = parts.slice(1).join(" ").trim();

  if (movieRef) {
    return {
      type: "movie",
      id: movieRef
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

function isNumericMovieRef(value = "") {
  return /^\d+$/.test(String(value || "").trim());
}

function isLibraryMovieRef(value = "") {
  return /^LIB-[A-Z0-9]+-\d+$/i.test(String(value || "").trim());
}

async function getMovieCandidates(pgPool, movieRef) {
  const refText = String(movieRef || "").trim();

  if (!refText) {
    return {
      direct: false,
      rows: []
    };
  }

  // Direkte Datenbank-ID: !hol 167 / !hol movie 167
  if (isNumericMovieRef(refText)) {
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
      WHERE id::text = $1::text
      LIMIT 1;
      `,
      [refText]
    );

    return {
      direct: true,
      rows: result.rows || []
    };
  }

  // Direkter Library-Code: !hol LIB-ACT-0001
  if (isLibraryMovieRef(refText)) {
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
      WHERE LOWER(library_id::text) = LOWER($1::text)
      LIMIT 1;
      `,
      [refText]
    );

    return {
      direct: true,
      rows: result.rows || []
    };
  }

  // Titel-Suche: !hol oblivion / !hol superman
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
    WHERE
      title ILIKE $1
      OR file_name ILIKE $1
      OR library_id::text ILIKE $1
    ORDER BY
      CASE
        WHEN LOWER(title) = LOWER($2) THEN 0
        WHEN LOWER(title) LIKE LOWER($3) THEN 1
        ELSE 2
      END,
      year NULLS LAST,
      title ASC
    LIMIT 10;
    `,
    [
      `%${refText}%`,
      refText,
      `${refText}%`
    ]
  );

  return {
    direct: false,
    rows: result.rows || []
  };
}

function formatMovieChoiceLine(movie) {
  const label =
    movie.library_id ||
    String(movie.id);

  const meta = [
    movie.quality,
    movie.resolution,
    movie.file_size,
    movie.runtime
  ]
    .map((v) => String(v || "").trim())
    .filter(Boolean)
    .join(" · ");

  return (
    `${label}. 🎬 ${movie.title || "Unbekannter Film"}${movie.year ? ` (${movie.year})` : ""}\n` +
    `   ${meta || "Keine technischen Daten"}\n` +
    `   !hol movie ${movie.id}`
  );
}

async function resolveSeriesBase(pgPool, seriesRef) {
  const refText = String(seriesRef || "").trim();

  if (!refText) {
    return null;
  }

  // ID / series_library_id
  if (/^\d+$/.test(refText)) {
    const result = await pgPool.query(
      `
      SELECT
        id,
        series_library_id,
        series_title
      FROM series
      WHERE
        series_library_id::text = $1::text
        OR id::text = $1::text
      ORDER BY
        CASE WHEN series_library_id::text = $1::text THEN 0 ELSE 1 END,
        season::integer ASC,
        episode::integer ASC
      LIMIT 1;
      `,
      [refText]
    );

    return result.rows[0] || null;
  }

  // Titel
  const result = await pgPool.query(
    `
    SELECT
      id,
      series_library_id,
      series_title
    FROM series
    WHERE
      LOWER(series_title) = LOWER($1)
      OR series_title ILIKE $2
    ORDER BY
      CASE
        WHEN LOWER(series_title) = LOWER($1) THEN 0
        WHEN LOWER(series_title) LIKE LOWER($3) THEN 1
        ELSE 2
      END,
      season::integer ASC,
      episode::integer ASC
    LIMIT 1;
    `,
    [
      refText,
      `%${refText}%`,
      `${refText}%`
    ]
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
        series_library_id::text = $1::text
        AND season::text = $2::text
        AND episode::text = $3::text
      LIMIT 1;
      `,
      [
        String(base.series_library_id),
        String(Number(season)),
        String(Number(episode))
      ]
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
        AND season::text = $2::text
        AND episode::text = $3::text
      LIMIT 1;
      `,
      [
        base.series_title,
        String(Number(season)),
        String(Number(episode))
      ]
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
        series_library_id::text = $1::text
        AND season::text = $2::text
      ORDER BY episode::integer ASC;
      `,
      [
        String(base.series_library_id),
        String(Number(season))
      ]
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
        AND season::text = $2::text
      ORDER BY episode::integer ASC;
      `,
      [
        base.series_title,
        String(Number(season))
      ]
    );
  }

  return {
    base,
    episodes: result.rows || []
  };
}

async function getAllSeriesEpisodes(pgPool, seriesRef) {
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
        series_library_id::text = $1::text
      ORDER BY
        season::integer ASC,
        episode::integer ASC;
      `,
      [
        String(base.series_library_id)
      ]
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
      ORDER BY
        season::integer ASC,
        episode::integer ASC;
      `,
      [
        base.series_title
      ]
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

  const movieRef = parsed.id;

  const candidates = await getMovieCandidates(pgPool, movieRef);

  if (!candidates.rows.length) {
    await bot.sendMessage(
      chatId,
      `❌ Film/Code "${movieRef}" wurde nicht gefunden.`,
      {
        reply_to_message_id: msg.message_id
      }
    );
    return true;
  }

  // Wenn Titel-Suche mehrere Treffer ergibt, nicht automatisch senden.
  // Dadurch wird kein Tageslimit verbraucht.
  if (!candidates.direct && candidates.rows.length > 1) {
    const message =
      `⚠️ Mehrere Treffer gefunden für:\n${movieRef}\n\n` +
      candidates.rows.map(formatMovieChoiceLine).join("\n\n") +
      "\n\n━━━━━━━━━━━━━━━━━━\n" +
      "Bitte nutze den eindeutigen !hol-Code aus der Liste.";

    await bot.sendMessage(
      chatId,
      message.slice(0, 3900),
      {
        reply_to_message_id: msg.message_id
      }
    );

    return true;
  }

  const movie = candidates.rows[0];

  const limitCheck = await canUseDownload(pgPool, from.id, "movie");

  if (!limitCheck.ok) {
    await bot.sendMessage(chatId, limitCheck.message, {
      reply_to_message_id: msg.message_id
    });
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

async function handleSeriesAllHol(bot, msg, pgPool, parsed) {
  const chatId = msg.chat.id;
  const from = msg.from;

  const limitCheck = await canUseDownload(pgPool, from.id, "series_all");

  if (!limitCheck.ok) {
    await bot.sendMessage(chatId, limitCheck.message, {
      reply_to_message_id: msg.message_id
    });
    return true;
  }

  const { base, episodes } = await getAllSeriesEpisodes(
    pgPool,
    parsed.seriesRef
  );

  if (!base) {
    await bot.sendMessage(
      chatId,
      `❌ Serie "${parsed.seriesRef}" wurde nicht gefunden.`,
      {
        reply_to_message_id: msg.message_id
      }
    );
    return true;
  }

  if (!episodes.length) {
    await bot.sendMessage(
      chatId,
      `❌ Keine Folgen gefunden.\n\n📺 ${base.series_title}`,
      {
        reply_to_message_id: msg.message_id
      }
    );
    return true;
  }

  const maxSeriesAllEpisodes =
    Number(process.env.MAX_SERIES_ALL_EPISODES || 30);

  const isAdminUser =
    limitCheck.user?.role === "admin";

  if (!isAdminUser && episodes.length > maxSeriesAllEpisodes) {
    const seasonRows = await pgPool.query(
      `
      SELECT
        season::text AS season,
        COUNT(*)::int AS episode_count
      FROM series
      WHERE
        ${
          base.series_library_id
            ? "series_library_id::text = $1::text"
            : "LOWER(series_title) = LOWER($1)"
        }
      GROUP BY season::text
      ORDER BY season::integer ASC;
      `,
      [
        base.series_library_id
          ? String(base.series_library_id)
          : base.series_title
      ]
    );

    const seasonLines = seasonRows.rows
      .map((row) => {
        const seasonNumber = Number(row.season);
        return `!hol serie ${parsed.seriesRef} staffel ${seasonNumber}`;
      })
      .join("\n");

    await bot.sendMessage(
      chatId,
      `⚠️ Diese Serie ist zu groß für "alle".\n\n` +
        `📺 ${base.series_title}\n` +
        `🎞 Folgen: ${episodes.length}\n` +
        `🚧 Maximum für automatische Komplettausgabe: ${maxSeriesAllEpisodes}\n\n` +
        `Bitte nutze stattdessen staffelweise:\n\n` +
        `${seasonLines}`,
      {
        reply_to_message_id: msg.message_id
      }
    );

    return true;
  }

  await bot.sendMessage(
    chatId,
    `📦 Komplette Serie wird vorbereitet:\n\n` +
      `📺 ${base.series_title}\n` +
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

    await sleep(1200);
  }

  if (sentCount > 0) {
    await logUsage(
      pgPool,
      from.id,
      "series_all",
      `${base.series_title}-ALL`
    );
  }

  await bot.sendMessage(
    chatId,
    `✅ Serie abgeschlossen.\n\n` +
      `📺 ${base.series_title}\n\n` +
      `✅ Gesendet: ${sentCount}\n` +
      `⚠️ Ohne file_id übersprungen: ${skippedCount}\n` +
      `❌ Fehlgeschlagen: ${failedCount}\n\n` +
      `📊 Tageslimit: ${limitCheck.remaining === "unbegrenzt" ? "unbegrenzt" : `${limitCheck.remaining - 1} Serie(n) übrig`}`,
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
  return await handleSeriesAllHol(bot, msg, pgPool, parsed);
}

  return false;
}

module.exports = {
  handleLibraryHolCommands
};