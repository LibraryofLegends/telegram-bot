const {
  isAdmin,
} = require("./access-control");

function pad2(value) {
  return String(value || 0).padStart(2, "0");
}

function parseEpisodeFromFileName(fileName = "") {
  const original =
    String(fileName || "").trim();

  const value =
    original
      .replace(/[_]+/g, " ")
      .replace(/[.]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  if (!value) return null;

  let match =
    value.match(/(?:^|[^a-z0-9])S\s*(\d{1,2})\s*E\s*(\d{1,3})(?=$|[^a-z0-9])/i);

  if (match) {
    return {
      season: Number(match[1]),
      episode: Number(match[2]),
      raw: match[0].trim()
    };
  }

  match =
    value.match(/(?:^|[^a-z0-9])(\d{1,2})\s*x\s*(\d{1,3})(?=$|[^a-z0-9])/i);

  if (match) {
    return {
      season: Number(match[1]),
      episode: Number(match[2]),
      raw: match[0].trim()
    };
  }

  return null;
}

function getDbSeasonEpisode(row) {
  const season = Number(row.season || 0);
  const episode = Number(row.episode || 0);

  if (!Number.isInteger(season) || !Number.isInteger(episode)) {
    return null;
  }

  if (season <= 0 || episode <= 0) {
    return null;
  }

  return {
    season,
    episode
  };
}

function isMismatch(row) {
  const db = getDbSeasonEpisode(row);
  const file = parseEpisodeFromFileName(row.file_name);

  if (!db || !file) {
    return false;
  }

  return db.season !== file.season || db.episode !== file.episode;
}

function formatEpisodeCheckLine(row, index) {
  const db = getDbSeasonEpisode(row);
  const file = parseEpisodeFromFileName(row.file_name);

  const dbText =
    db
      ? `S${pad2(db.season)}E${pad2(db.episode)}`
      : "unbekannt";

  const fileText =
    file
      ? `S${pad2(file.season)}E${pad2(file.episode)}`
      : "nicht erkannt";

  return (
    `${index + 1}. ⚠️ ${row.series_title || "Unbekannte Serie"}\n` +
    `   DB-ID: ${row.id}\n` +
    `   DB: ${dbText}\n` +
    `   Datei: ${fileText}\n` +
    `   Episodentitel: ${row.episode_title || "—"}\n` +
    `   Dateiname: ${row.file_name || "—"}\n` +
    `   Details: /episodecheck ${row.id}`
  );
}

async function getEpisodeRows(pgPool, query = "", limit = 3000) {
  const cleanQuery =
    String(query || "").trim();

  const cleanLimit =
    Math.max(1, Math.min(Number(limit) || 3000, 8000));

  if (cleanQuery) {
    const result = await pgPool.query(
      `
      SELECT
        id,
        series_title,
        season,
        episode,
        episode_title,
        file_name,
        created_at
      FROM series
      WHERE file_name IS NOT NULL
        AND TRIM(file_name) <> ''
        AND (
          id::text = $1::text
          OR series_title ILIKE $2
          OR episode_title ILIKE $2
          OR file_name ILIKE $2
        )
      ORDER BY
        series_title ASC,
        CASE
          WHEN season::text ~ '^[0-9]+$'
          THEN season::int
          ELSE 999
        END ASC,
        CASE
          WHEN episode::text ~ '^[0-9]+$'
          THEN episode::int
          ELSE 999
        END ASC,
        id ASC
      LIMIT $3;
      `,
      [
        cleanQuery,
        `%${cleanQuery}%`,
        cleanLimit
      ]
    );

    return result.rows || [];
  }

  const result = await pgPool.query(
    `
    SELECT
      id,
      series_title,
      season,
      episode,
      episode_title,
      file_name,
      created_at
    FROM series
    WHERE file_name IS NOT NULL
      AND TRIM(file_name) <> ''
    ORDER BY
      created_at DESC NULLS LAST,
      id DESC
    LIMIT $1;
    `,
    [
      cleanLimit
    ]
  );

  return result.rows || [];
}

function buildEpisodeCheckMessage(query, rows) {
  const checkedRows =
    rows || [];

  const mismatches =
    checkedRows.filter(isMismatch);

  const title =
    query
      ? `🧪 Episoden-Abgleich: ${query}`
      : "🧪 Episoden-Abgleich";

  if (!mismatches.length) {
    return (
      `${title}\n` +
      `━━━━━━━━━━━━━━━━━━\n\n` +
      `Keine offensichtlichen DB/Dateiname-Abweichungen gefunden.\n\n` +
      `Geprüfte Einträge: ${checkedRows.length}`
    );
  }

  return (
    `${title}\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    `Verdacht: DB-Folge passt nicht zum Dateinamen\n\n` +
    mismatches.slice(0, 25).map(formatEpisodeCheckLine).join("\n\n") +
    `\n\n━━━━━━━━━━━━━━━━━━\n` +
    `Treffer: ${mismatches.length}\n` +
    `Geprüfte Einträge: ${checkedRows.length}\n\n` +
    `Hinweis: Es wird nichts automatisch geändert.`
  );
}

async function handleEpisodeCheckCommands(bot, msg, pgPool) {
  const text =
    String(msg.text || "").trim();

  const chatId =
    msg.chat.id;

  const from =
    msg.from;

  if (!from || !text) return false;

  const supported =
    text === "/episodecheck" ||
    text === "/episodemismatch" ||
    text.startsWith("/episodecheck ") ||
    text.startsWith("/episodemismatch ");

  if (!supported) {
    return false;
  }

  if (!isAdmin(from.id)) {
    await bot.sendMessage(
      chatId,
      "⛔ Nur Admins können den Episoden-Abgleich nutzen.",
      {
        reply_to_message_id: msg.message_id
      }
    );

    return true;
  }

  const query =
    text
      .replace(/^\/episodecheck\s*/i, "")
      .replace(/^\/episodemismatch\s*/i, "")
      .trim();

  const rows =
    await getEpisodeRows(pgPool, query, query ? 500 : 3000);

  await bot.sendMessage(
    chatId,
    buildEpisodeCheckMessage(query, rows).slice(0, 3900),
    {
      reply_to_message_id: msg.message_id
    }
  );

  return true;
}

module.exports = {
  handleEpisodeCheckCommands,
};