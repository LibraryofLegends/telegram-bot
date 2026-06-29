const {
  isAdmin,
} = require("./access-control");

function looksLikeEpisodeFileName(fileName = "") {
  const value = String(fileName || "").trim();

  if (!value) return false;

  return (
    /\bS\d{1,2}\s*E\d{1,3}\b/i.test(value) ||
    /\bS\d{1,2}E\d{1,3}\b/i.test(value) ||
    /\bStaffel\s*\d{1,2}\b/i.test(value) ||
    /\bEpisode\s*\d{1,3}\b/i.test(value) ||
    /\bFolge\s*\d{1,3}\b/i.test(value) ||
    /\b\d{1,2}x\d{1,3}\b/i.test(value)
  );
}

function extractEpisodeHint(fileName = "") {
  const value = String(fileName || "");

  const sxe =
    value.match(/\bS(\d{1,2})\s*E(\d{1,3})\b/i) ||
    value.match(/\bS(\d{1,2})E(\d{1,3})\b/i);

  if (sxe) {
    return `S${String(sxe[1]).padStart(2, "0")}E${String(sxe[2]).padStart(2, "0")}`;
  }

  const xFormat = value.match(/\b(\d{1,2})x(\d{1,3})\b/i);

  if (xFormat) {
    return `S${String(xFormat[1]).padStart(2, "0")}E${String(xFormat[2]).padStart(2, "0")}`;
  }

  const episode = value.match(/\b(Episode|Folge)\s*(\d{1,3})\b/i);

  if (episode) {
    return `Folge ${episode[2]}`;
  }

  return "Serienmuster erkannt";
}

function formatWrongMovieLine(movie, index) {
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
    `${index + 1}. ⚠️ ${movie.title || "Unbekannter Film"}${movie.year ? ` (${movie.year})` : ""}\n` +
    `   DB-ID: ${movie.id}\n` +
    `   🆔 ${label}\n` +
    `   Verdacht: ${extractEpisodeHint(movie.file_name)}\n` +
    `   ${meta || "Keine technischen Daten"}\n` +
    `   Datei: ${movie.file_name || "—"}\n` +
    `   Prüfen: /wrongmovie ${movie.id}`
  );
}

async function getWrongMovieImports(pgPool, limit = 30) {
  const result = await pgPool.query(
    `
    SELECT
      id,
      title,
      year,
      library_id,
      quality,
      resolution,
      file_size,
      runtime,
      file_name,
      created_at
    FROM movies
    WHERE file_name IS NOT NULL
      AND TRIM(file_name) <> ''
      AND (
        file_name ~* '\\mS[0-9]{1,2}\\s*E[0-9]{1,3}\\M'
        OR file_name ~* '\\m[0-9]{1,2}x[0-9]{1,3}\\M'
        OR file_name ILIKE '%Staffel%'
        OR file_name ILIKE '%Episode%'
        OR file_name ILIKE '%Folge%'
      )
    ORDER BY
      created_at DESC NULLS LAST,
      id DESC
    LIMIT $1;
    `,
    [
      Math.max(1, Math.min(Number(limit) || 30, 50))
    ]
  );

  return result.rows || [];
}

async function findWrongMovieImports(pgPool, query, limit = 30) {
  const result = await pgPool.query(
    `
    SELECT
      id,
      title,
      year,
      library_id,
      quality,
      resolution,
      file_size,
      runtime,
      file_name,
      created_at
    FROM movies
    WHERE
      (
        id::text = $1::text
        OR title ILIKE $2
        OR file_name ILIKE $2
      )
      AND file_name IS NOT NULL
      AND TRIM(file_name) <> ''
    ORDER BY
      id ASC
    LIMIT $3;
    `,
    [
      String(query),
      `%${query}%`,
      Math.max(1, Math.min(Number(limit) || 30, 50))
    ]
  );

  return (result.rows || []).filter((movie) => {
    return looksLikeEpisodeFileName(movie.file_name);
  });
}

function buildWrongImportsMessage(rows) {
  if (!rows.length) {
    return (
      `🧪 Fehlimport-Scanner\n` +
      `━━━━━━━━━━━━━━━━━━\n\n` +
      `Keine offensichtlichen Serienfolgen in der Film-Tabelle gefunden.`
    );
  }

  return (
    `🧪 Fehlimport-Scanner\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    `Verdacht: Serienfolgen in der Film-Tabelle\n\n` +
    rows.map(formatWrongMovieLine).join("\n\n") +
    `\n\n━━━━━━━━━━━━━━━━━━\n` +
    `Hinweis: Es wird nichts automatisch gelöscht.\n\n` +
    `Details:\n` +
    `/wrongmovie ID\n` +
    `/wrongmovie TITEL`
  );
}

function buildWrongMovieDetailMessage(query, rows) {
  if (!rows.length) {
    return (
      `🔎 Fehlimport-Details\n` +
      `━━━━━━━━━━━━━━━━━━\n\n` +
      `Suche: ${query}\n\n` +
      `Keine verdächtigen Film-Einträge gefunden.`
    );
  }

  return (
    `🔎 Fehlimport-Details\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    `Suche: ${query}\n\n` +
    rows.map(formatWrongMovieLine).join("\n\n") +
    `\n\n━━━━━━━━━━━━━━━━━━\n` +
    `Empfehlung:\n` +
    `1. Prüfen, ob der Eintrag wirklich eine Serienfolge ist.\n` +
    `2. Falls ja, nicht als Film behalten.\n` +
    `3. Erst löschen, wenn die Folge korrekt in der Serien-Tabelle vorhanden ist.`
  );
}

async function handleWrongImportCommands(bot, msg, pgPool) {
  const text =
    String(msg.text || "").trim();

  const chatId =
    msg.chat.id;

  const from =
    msg.from;

  if (!from || !text) return false;

  const supported =
    text === "/wrongimports" ||
    text === "/wrongmovies" ||
    text.startsWith("/wrongmovie ");

  if (!supported) {
    return false;
  }

  if (!isAdmin(from.id)) {
    await bot.sendMessage(
      chatId,
      "⛔ Nur Admins können den Fehlimport-Scanner nutzen.",
      {
        reply_to_message_id: msg.message_id
      }
    );

    return true;
  }

  if (text === "/wrongimports" || text === "/wrongmovies") {
    const rows = await getWrongMovieImports(pgPool, 30);

    await bot.sendMessage(
      chatId,
      buildWrongImportsMessage(rows).slice(0, 3900),
      {
        reply_to_message_id: msg.message_id
      }
    );

    return true;
  }

  if (text.startsWith("/wrongmovie ")) {
    const query =
      text.replace(/^\/wrongmovie\s+/i, "").trim();

    if (!query) {
      await bot.sendMessage(
        chatId,
        "❌ Nutzung:\n/wrongmovie ID\n/wrongmovie TITEL",
        {
          reply_to_message_id: msg.message_id
        }
      );

      return true;
    }

    const rows = await findWrongMovieImports(pgPool, query, 30);

    await bot.sendMessage(
      chatId,
      buildWrongMovieDetailMessage(query, rows).slice(0, 3900),
      {
        reply_to_message_id: msg.message_id
      }
    );

    return true;
  }

  return false;
}

module.exports = {
  handleWrongImportCommands,
};