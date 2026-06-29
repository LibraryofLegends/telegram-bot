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
  const value = String(fileName || "").trim();

  if (!value) return null;

  let match =
    value.match(/\bS(\d{1,2})\s*E(\d{1,3})\b/i) ||
    value.match(/\bS(\d{1,2})E(\d{1,3})\b/i);

  if (match) {
    return {
      season: Number(match[1]),
      episode: Number(match[2]),
      raw: match[0]
    };
  }

  match = value.match(/\b(\d{1,2})x(\d{1,3})\b/i);

  if (match) {
    return {
      season: Number(match[1]),
      episode: Number(match[2]),
      raw: match[0]
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
    /\s*-\s*\(?\d{4}\)?\s*-\s*\d{1,2}x\d{1,3}\s*[-–—]\s*.+$/i,
    /\s*\(?\d{4}\)?\s*\d{1,2}x\d{1,3}\s*[-–—]\s*.+$/i,
    /\s*\(?\d{4}\)?\s*\d{1,2}x\d{1,3}\s+.+$/i,

    /\s*-\s*S\d{1,2}\s*E\d{1,3}\s*[-–—]\s*.+$/i,
    /\s*S\d{1,2}\s*E\d{1,3}\s*[-–—]\s*.+$/i,
    /\s*S\d{1,2}\s*E\d{1,3}\s+.+$/i,

    /\s*S\d{1,2}E\d{1,3}\s*[-–—]\s*.+$/i,
    /\s*S\d{1,2}E\d{1,3}\s+.+$/i,

    /\s*-\s*\d{1,2}x\d{1,3}\s*[-–—]\s*.+$/i,
    /\s*\d{1,2}x\d{1,3}\s+.+$/i
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

async function getSeriesGroupRows(pgPool, query, limit = 1000) {
  const cleanQuery =
    String(query || "").trim();

  const cleanLimit =
    Math.max(1, Math.min(Number(limit) || 1000, 3000));

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

    if (base?.series_library_id) {
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

    if (base?.series_title) {
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
          String(base.series_title),
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
        key,
        name: clusterName,
        count: 0,
        mismatches: 0,
        firstId: row.id
      };

    current.count += 1;

    if (isMismatch(row)) {
      current.mismatches += 1;
    }

    clusters.set(key, current);
  }

  return Array.from(clusters.values())
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

function formatClusterEpisodeLine(row, index) {
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
    `   DB: ${dbCode} · Datei: ${fileCode}\n` +
    `   Titel: ${row.episode_title || "—"}\n` +
    `   Datei: ${row.file_name || "—"}\n` +
    `   Prüfen: /episodecheck ${row.id}`
  );
}

function buildSeriesClustersMessage(query, rows) {
  if (!rows.length) {
    return (
      `📦 Serien-Cluster\n` +
      `━━━━━━━━━━━━━━━━━━\n\n` +
      `Keine Folgen gefunden für:\n` +
      `${query}`
    );
  }

  const clusters =
    buildClusterSummary(rows);

  const libraryIds =
    Array.from(
      new Set(
        rows
          .map((row) => row.series_library_id)
          .filter(Boolean)
          .map(String)
      )
    );

  const titles =
    Array.from(
      new Set(
        rows
          .map((row) => row.series_title)
          .filter(Boolean)
      )
    );

  const lines =
    clusters.map((cluster, index) => {
      return (
        `${index + 1}. ${cluster.name}\n` +
        `   Folgen: ${cluster.count}\n` +
        `   Abweichungen: ${cluster.mismatches}\n` +
        `   Details: /seriescluster ${query} ${cluster.name}`
      );
    }).join("\n\n");

  return (
    `📦 Serien-Cluster: ${query}\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    `Serientitel: ${titles.slice(0, 3).join(" / ") || "—"}\n` +
    `Library-ID(s): ${libraryIds.join(", ") || "—"}\n` +
    `Gefundene Folgen: ${rows.length}\n` +
    `Cluster: ${clusters.length}\n\n` +
    lines +
    `\n\n━━━━━━━━━━━━━━━━━━\n` +
    `Cluster öffnen mit:\n` +
    `/seriescluster ${query} CLUSTERNAME`
  );
}

function buildSeriesClusterDetailMessage(query, clusterQuery, rows) {
  if (!rows.length) {
    return (
      `📦 Serien-Cluster Details\n` +
      `━━━━━━━━━━━━━━━━━━\n\n` +
      `Keine passenden Folgen gefunden.\n\n` +
      `Gruppe: ${query}\n` +
      `Cluster: ${clusterQuery}`
    );
  }

  const mismatches =
    rows.filter(isMismatch);

  return (
    `📦 Serien-Cluster Details\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    `Gruppe: ${query}\n` +
    `Cluster: ${clusterQuery}\n` +
    `Folgen: ${rows.length}\n` +
    `Abweichungen: ${mismatches.length}\n\n` +
    rows.slice(0, 25).map(formatClusterEpisodeLine).join("\n\n") +
    `\n\n━━━━━━━━━━━━━━━━━━\n` +
    `Hinweis: Es wird nichts geändert.\n\n` +
    `Bei falscher Nummerierung:\n` +
    `/episodefix ID\n\n` +
    `Bei echten Duplikaten:\n` +
    `/trashdupeepisode keep ID remove ID`
  );
}

async function handleSeriesClusterCommands(bot, msg, pgPool) {
  const text =
    String(msg.text || "").trim();

  const chatId =
    msg.chat.id;

  const from =
    msg.from;

  if (!from || !text) return false;

  const supported =
    text.startsWith("/seriesclusters ") ||
    text.startsWith("/seriescluster ");

  if (!supported) {
    return false;
  }

  if (!isAdmin(from.id)) {
    await bot.sendMessage(
      chatId,
      "⛔ Nur Admins können Serien-Cluster prüfen.",
      {
        reply_to_message_id: msg.message_id
      }
    );

    return true;
  }

  if (text.startsWith("/seriesclusters ")) {
    const query =
      text.replace(/^\/seriesclusters\s+/i, "").trim();

    if (!query) {
      await bot.sendMessage(
        chatId,
        "❌ Nutzung:\n/seriesclusters ID\n/seriesclusters TITEL",
        {
          reply_to_message_id: msg.message_id
        }
      );

      return true;
    }

    const rows =
      await getSeriesGroupRows(pgPool, query, 1000);

    await bot.sendMessage(
      chatId,
      buildSeriesClustersMessage(query, rows).slice(0, 3900),
      {
        reply_to_message_id: msg.message_id
      }
    );

    return true;
  }

  if (text.startsWith("/seriescluster ")) {
    const raw =
      text.replace(/^\/seriescluster\s+/i, "").trim();

    const parts =
      raw.split(/\s+/);

    const query =
      parts[0];

    const clusterQuery =
      parts.slice(1).join(" ").trim();

    if (!query || !clusterQuery) {
      await bot.sendMessage(
        chatId,
        `❌ Nutzung:\n\n` +
          `/seriescluster ID CLUSTERNAME\n\n` +
          `Beispiele:\n` +
          `/seriescluster 1513 der unglaubliche hulk\n` +
          `/seriescluster 1513 tih\n` +
          `/seriescluster 1513 the incredible hulk`,
        {
          reply_to_message_id: msg.message_id
        }
      );

      return true;
    }

    const rows =
      await getSeriesGroupRows(pgPool, query, 1000);

    const normalizedClusterQuery =
      normalizeText(clusterQuery);

    const filtered =
      rows.filter((row) => {
        const clusterName =
          extractFileClusterName(row.file_name);

        return normalizeText(clusterName).includes(normalizedClusterQuery);
      });

    await bot.sendMessage(
      chatId,
      buildSeriesClusterDetailMessage(query, clusterQuery, filtered).slice(0, 3900),
      {
        reply_to_message_id: msg.message_id
      }
    );

    return true;
  }

  return false;
}

module.exports = {
  handleSeriesClusterCommands,
};