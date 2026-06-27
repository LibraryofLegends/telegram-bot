const {
  canUseDownload,
  logUsage
} = require("./access-control");

function parseHolCommand(text = "") {
  const parts = String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  // Beispiele:
  // !hol movie 21
  // !hol film 21
  // !hol 21

  if (parts.length < 2) {
    return null;
  }

  if (parts[0].toLowerCase() !== "!hol" && parts[0].toLowerCase() !== "/hol") {
    return null;
  }

  // !hol 21 => vorerst als Film behandeln
  if (/^\d+$/.test(parts[1])) {
    return {
      type: "movie",
      id: Number(parts[1])
    };
  }

  const typeRaw = parts[1].toLowerCase();

  if ((typeRaw === "movie" || typeRaw === "film") && /^\d+$/.test(parts[2] || "")) {
    return {
      type: "movie",
      id: Number(parts[2])
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

async function sendMovieByFileId(bot, chatId, movie, replyToMessageId) {
  const caption = buildMovieCaption(movie);

  // Erst als Video versuchen.
  // Falls die gespeicherte file_id ein Document-file_id ist, schlägt sendVideo fehl.
  try {
    await bot.sendVideo(chatId, movie.file_id, {
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

  // Fallback als Dokument.
  try {
    await bot.sendDocument(chatId, movie.file_id, {
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

async function handleLibraryHolCommands(bot, msg, pgPool) {
  const text = msg.text || "";
  const chatId = msg.chat.id;
  const from = msg.from;

  if (!from) return false;

  const parsed = parseHolCommand(text);

  if (!parsed) {
    return false;
  }

  if (parsed.type !== "movie") {
    await bot.sendMessage(
      chatId,
      "⚠️ Aktuell ist nur Film-Holen aktiv.\n\nBeispiel:\n!hol movie 21",
      {
        reply_to_message_id: msg.message_id
      }
    );
    return true;
  }

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

  const sent = await sendMovieByFileId(bot, chatId, movie, msg.message_id);

  if (!sent.ok) {
    await bot.sendMessage(
      chatId,
      "❌ Der Film konnte nicht gesendet werden.\n\n" +
        "Mögliche Gründe:\n" +
        "• file_id ist ungültig\n" +
        "• Bot hat keinen Zugriff mehr\n" +
        "• Datei wurde anders gespeichert als erwartet",
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

module.exports = {
  handleLibraryHolCommands
};