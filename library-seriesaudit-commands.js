const {
  isAdmin,
} = require("./access-control");

function pad2(value) {
  return String(value || 0).padStart(2, "0");
}

function stripExtension(fileName = "") {
  return String(fileName || "").replace(/\.[a-z0-9]{2,5}$/i, "");
}

function normalizeText(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatEpisodeCode(season, episode) {
  const s = Number(season || 0);
  const e = Number(episode || 0);

  if (!s || !e) {
    return "S??E??";
  }

  return `S${pad2(s)}E${pad2(e)}`;
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

function extractFileClusterName(fileName = "") {
  let base = stripExtension(fileName)
    .replace(/@.+$/i, "")
    .replace(/[_]+/g, " ")
    .replace(/[.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!base) {
    return "Unbekannt";
  }

  const patterns = [
    /\s*-\s*\(?\d{4}\)?\s*-\s*\d{1,2}\s*x\s*\d{1,3}\s*[-–—]\s*.+$/i,
    /\s*\(?\d{4}\)?\s*\d{1,2}\s*x\s*\d{1,3}\s*[-–—]\s*.+$/i,
    /\s*\(?\d{4}\)?\s*\d{1,2}\s*x\s*\d{1,3}\s+.+$/i,

    /\s*-\s*S\s*\d{1,2}\s*E\s*\d{1,3}\s*[-–—]\s*.+$/i,
    /\s*S\s*\d{1,2}\s*E\s*\d{1,3}\s*[-–—]\s*.+$/i,
    /\s*S\s*\d{1,2}\s*E\s*\d{1,3}\s+.+$/i,

    /\s*S\d{1,2}E\d{1,3}\s*[-–—]\s*.+$/i,
    /\s*S\d{1,2}E\d{1,3}\s+.+$/i,

    /\s*-\s*\d{1,2}\s*x\s*\d{1,3}\s*[-–—]\s*.+$/i,
    /\s*\d{1,2}\s*x\s*\d{1,3}\s+.+$/i
  ];

  for (const pattern of patterns) {
    base = base.replace(pattern, "").trim();
  }

  base = base
    .replace(/\s*-\s*\(?\d{4}\)?\s*$/i, "")
    .replace(/\s+\(?\d{4}\)?\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();

  return base || "Unbekannt";
}

function isMismatch(row) {
  const fileInfo =
    parseEpisodeFromFileName(row.file_name);

  if (!fileInfo) {
    return false;
  }

  const dbSeason =
    Number(row.season || 0);

  const dbEpisode =
    Number(row.episode || 0);

  return (
    dbSeason !== fileInfo.season ||
    dbEpisode !== fileInfo.episode
  );
}

function formatAuditLine(row, index) {
  const fileInfo =
    parseEpisodeFromFileName(row.file_name);

  const dbCode =
    formatEpisodeCode(row.season, row.episode);

  const fileCode =
    fileInfo
      ? formatEpisodeCode(fileInfo.season, fileInfo.episode)
      : "nicht erkannt";

  const marker =
    isMismatch(row)
      ? "⚠️"
      : "✅";

  return (
    `${index + 1}. ${marker} DB-ID ${row.id}\n` +
    `   DB: ${dbCode}\n` +
    `   Datei: ${fileCode}\n` +
    `   Titel: ${row.episode_title || "—"}\n` +
    `   Datei: ${row.file_name || "—"}`
  );
}

async function getSeriesAuditRows(pgPool, query, limit = 500) {
  const cleanQuery =
    String(query || "").trim();

  const cleanLimit =
    Math.max(1, Math.min(Number(limit) || 500, 2000));

  // Wenn eine konkrete Episoden-ID eingegeben wird,
  // laden wir automatisch die komplette Serien-Gruppe dieser Episode.
  if (/^\d+$/.test(cleanQuery)) {
    const baseResult = await pgPool.query(
      `
      SELECT
        id,
        series_title,
        series_library_id
      FROM series
      WHERE id::text = $1::text
      LIMIT 1;
      `,
      [cleanQuery]
    );

    const base =
      baseResult.rows[0];

    if (base) {
      if (base.series_library_id) {
        const groupResult = await pgPool.query(
          `
          SELECT
            id,
            series_library_id,
            series_title,
            season,
            episode,
            episode_title,
            file_name,
            created_at
          FROM series
          WHERE series_library_id::text = $1::text
          ORDER BY
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
          LIMIT $2;
          `,
          [
            String(base.series_library_id),
            cleanLimit
          ]
        );

        return groupResult.rows || [];
      }

      const titleResult = await pgPool.query(
        `
        SELECT
          id,
          series_library_id,
          series_title,
          season,
          episode,
          episode_title,
          file_name,
          created_at
        FROM series
        WHERE LOWER(series_title) = LOWER($1)
        ORDER BY
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
        LIMIT $2;
        `,
        [
          String(base.series_title || ""),
          cleanLimit
        ]
      );

      return titleResult.rows || [];
    }
  }

  const result = await pgPool.query(
    `
    SELECT
      id,
      series_library_id,
      series_title,
      season,
      episode,
      episode_title,
      file_name,
      created_at
    FROM series
    WHERE
      series_title ILIKE $1
      OR episode_title ILIKE $1
      OR file_name ILIKE $1
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
    LIMIT $2;
    `,
    [
      `%${cleanQuery}%`,
      cleanLimit
    ]
  );

  return result.rows || [];
}

function buildClusterSummary(rows) {
  const clusters = new Map();

  for (const row of rows) {
    const clusterName =
      extractFileClusterName(row.file_name);

    const key =
      normalizeText(clusterName) || "unknown";

    const current =
      clusters.get(key) || {
        name: clusterName,
        count: 0,
        mismatches: 0,
        examples: []
      };

    current.count += 1;

    if (isMismatch(row)) {
      current.mismatches += 1;
    }

    if (current.examples.length < 3) {
      current.examples.push(row);
    }

    clusters.set(key, current);
  }

  return Array.from(clusters.values())
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

function buildSeriesAuditMessage(query, rows) {
  if (!rows.length) {
    return (
      `🧭 Serien-Audit\n` +
      `━━━━━━━━━━━━━━━━━━\n\n` +
      `Keine Serienfolgen gefunden für:\n` +
      `${query}`
    );
  }

  const clusters =
    buildClusterSummary(rows);

  const mismatches =
    rows.filter(isMismatch);

  const clusterLines =
    clusters.map((cluster, index) => {
      return (
        `${index + 1}. ${cluster.name}\n` +
        `   Folgen: ${cluster.count}\n` +
        `   Abweichungen: ${cluster.mismatches}`
      );
    }).join("\n\n");

  const mismatchLines =
    mismatches.length
      ? mismatches.slice(0, 20).map(formatAuditLine).join("\n\n")
      : "Keine offensichtlichen DB/Dateiname-Abweichungen gefunden.";

    const libraryIds =
    Array.from(
      new Set(
        rows
          .map((row) => row.series_library_id)
          .filter(Boolean)
          .map(String)
      )
    );

  const seriesTitles =
    Array.from(
      new Set(
        rows
          .map((row) => row.series_title)
          .filter(Boolean)
      )
    );

  return (
    `🧭 Serien-Audit: ${query}\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    `Serientitel: ${seriesTitles.slice(0, 3).join(" / ") || "—"}\n` +
    `Library-ID(s): ${libraryIds.join(", ") || "—"}\n` +
    `Gefundene Folgen: ${rows.length}\n` +
    `Abweichungen: ${mismatches.length}\n` +
    `Datei-Cluster: ${clusters.length}\n\n` +

    `📦 Datei-Cluster\n\n` +
    clusterLines +
    `\n\n━━━━━━━━━━━━━━━━━━\n\n` +

    `⚠️ Abweichungen\n\n` +
    mismatchLines +
    `\n\n━━━━━━━━━━━━━━━━━━\n` +
    `Hinweis: Es wird nichts geändert.\n\n` +
    `Einzelprüfung:\n` +
    `/episodecheck ID\n\n` +
    `Reparatur-Vorschau:\n` +
    `/episodefix ID`
  );
}

async function handleSeriesAuditCommands(bot, msg, pgPool) {
  const text =
    String(msg.text || "").trim();

  const chatId =
    msg.chat.id;

  const from =
    msg.from;

  if (!from || !text) return false;

  const supported =
    text === "/seriesaudit" ||
    text.startsWith("/seriesaudit ");

  if (!supported) {
    return false;
  }

  if (!isAdmin(from.id)) {
    await bot.sendMessage(
      chatId,
      "⛔ Nur Admins können den Serien-Audit nutzen.",
      {
        reply_to_message_id: msg.message_id
      }
    );

    return true;
  }

  const query =
    text.replace(/^\/seriesaudit\s*/i, "").trim();

  if (!query) {
    await bot.sendMessage(
      chatId,
      `❌ Nutzung:\n\n` +
        `/seriesaudit TITEL\n` +
        `/seriesaudit ID\n\n` +
        `Beispiele:\n` +
        `/seriesaudit hulk\n` +
        `/seriesaudit 1513`,
      {
        reply_to_message_id: msg.message_id
      }
    );

    return true;
  }

  const rows =
    await getSeriesAuditRows(pgPool, query, 500);

  await bot.sendMessage(
    chatId,
    buildSeriesAuditMessage(query, rows).slice(0, 3900),
    {
      reply_to_message_id: msg.message_id
    }
  );

  return true;
}

module.exports = {
  handleSeriesAuditCommands,
};