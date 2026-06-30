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

function filterRowsByCluster(rows, clusterQuery) {
  const normalizedClusterQuery =
    normalizeText(clusterQuery);

  return rows.filter((row) => {
    const clusterName =
      extractFileClusterName(row.file_name);

    return normalizeText(clusterName).includes(normalizedClusterQuery);
  });
}

function buildEpisodeLine(row, index) {
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
    `   Datei: ${row.file_name || "—"}`
  );
}

async function createSeriesLibrary(pgPool, title) {
  const result = await pgPool.query(
    `
    INSERT INTO series_library (
      title
    )
    VALUES (
      $1
    )
    RETURNING
      id,
      title;
    `,
    [
      title
    ]
  );

  return result.rows[0] || null;
}

async function updateSeriesLibraryCounters(pgPool, libraryId) {
  try {
    await pgPool.query(
      `
      UPDATE series_library
      SET
        total_episodes = (
          SELECT COUNT(*)::int
          FROM series
          WHERE series_library_id::text = $1::text
        ),
        total_seasons = (
          SELECT COUNT(DISTINCT season::text)::int
          FROM series
          WHERE series_library_id::text = $1::text
        )
      WHERE id::text = $1::text;
      `,
      [
        String(libraryId)
      ]
    );
  } catch (err) {
    console.warn("⚠️ Serien-Zähler konnten nicht aktualisiert werden:", err.message);
  }
}

async function splitSeriesCluster(pgPool, rows, newTitle, editedBy) {
  const selectedIds =
    rows.map((row) => String(row.id));

  const beforeData =
    rows.map((row) => ({
      id: row.id,
      series_library_id: row.series_library_id,
      series_title: row.series_title,
      season: row.season,
      episode: row.episode,
      episode_title: row.episode_title,
      file_name: row.file_name
    }));

  const newLibrary =
    await createSeriesLibrary(pgPool, newTitle);

  if (!newLibrary?.id) {
    return null;
  }

  const updateResult = await pgPool.query(
    `
    UPDATE series
    SET
      series_library_id = $1,
      series_title = $2
    WHERE id::text = ANY($3::text[])
    RETURNING
      id,
      series_library_id,
      series_title,
      season,
      episode,
      episode_title,
      file_name;
    `,
    [
      newLibrary.id,
      newTitle,
      selectedIds
    ]
  );

  const updatedRows =
    updateResult.rows || [];

  await updateSeriesLibraryCounters(pgPool, newLibrary.id);

  const oldLibraryIds =
    Array.from(
      new Set(
        beforeData
          .map((row) => row.series_library_id)
          .filter(Boolean)
          .map(String)
      )
    );

  for (const oldLibraryId of oldLibraryIds) {
    await updateSeriesLibraryCounters(pgPool, oldLibraryId);
  }

  try {
    await pgPool.query(
      `
      INSERT INTO library_edit_logs (
        item_type,
        item_ref,
        action,
        before_data,
        after_data,
        edited_by
      )
      VALUES (
        'series_cluster',
        $1,
        'series_cluster_split',
        $2::jsonb,
        $3::jsonb,
        $4
      );
      `,
      [
        String(newLibrary.id),
        JSON.stringify({
          moved_ids: selectedIds,
          before: beforeData
        }),
        JSON.stringify({
          new_library: newLibrary,
          updated: updatedRows
        }),
        editedBy
      ]
    );
  } catch (err) {
    console.warn("⚠️ Split-Log konnte nicht geschrieben werden:", err.message);
  }

  return {
    newLibrary,
    updatedRows
  };
}

function parseSeriesSplitCommand(text = "") {
  const clean =
    String(text || "").trim();

  if (!clean.startsWith("/seriessplit ")) {
    return null;
  }

  const raw =
    clean.replace(/^\/seriessplit\s+/i, "").trim();

  const parts =
    raw.split(/\s+/);

  const groupQuery =
    parts[0];

  const titleIndex =
    parts.findIndex((part) => part.toLowerCase() === "title");

  if (!groupQuery || titleIndex < 2) {
    return {
      invalid: true
    };
  }

  const confirmed =
    parts.some((part) => part.toLowerCase() === "confirm");

  const clusterQuery =
    parts
      .slice(1, titleIndex)
      .join(" ")
      .trim();

  const newTitle =
    parts
      .slice(titleIndex + 1)
      .filter((part) => part.toLowerCase() !== "confirm")
      .join(" ")
      .trim();

  if (!clusterQuery || !newTitle) {
    return {
      invalid: true
    };
  }

  return {
    groupQuery,
    clusterQuery,
    newTitle,
    confirmed
  };
}

function buildSplitPreviewMessage(parsed, allRows, selectedRows) {
  if (!allRows.length) {
    return (
      `📦 Serien-Split\n` +
      `━━━━━━━━━━━━━━━━━━\n\n` +
      `Keine Seriengruppe gefunden für:\n` +
      `${parsed.groupQuery}`
    );
  }

  if (!selectedRows.length) {
    return (
      `📦 Serien-Split\n` +
      `━━━━━━━━━━━━━━━━━━\n\n` +
      `Keine passenden Folgen für diesen Cluster gefunden.\n\n` +
      `Gruppe: ${parsed.groupQuery}\n` +
      `Cluster: ${parsed.clusterQuery}`
    );
  }

  const oldLibraryIds =
    Array.from(
      new Set(
        selectedRows
          .map((row) => row.series_library_id)
          .filter(Boolean)
          .map(String)
      )
    );

  const oldTitles =
    Array.from(
      new Set(
        selectedRows
          .map((row) => row.series_title)
          .filter(Boolean)
      )
    );

  const mismatches =
    selectedRows.filter(isMismatch);

  return (
    `📦 Serien-Split Vorschau\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    `Aktuelle Gruppe: ${parsed.groupQuery}\n` +
    `Bisherige Library-ID(s): ${oldLibraryIds.join(", ") || "—"}\n` +
    `Bisheriger Titel: ${oldTitles.slice(0, 3).join(" / ") || "—"}\n\n` +
    `Cluster: ${parsed.clusterQuery}\n` +
    `Neuer Serientitel: ${parsed.newTitle}\n` +
    `Folgen zum Verschieben: ${selectedRows.length}\n` +
    `Abweichungen: ${mismatches.length}\n\n` +
    selectedRows.slice(0, 20).map(buildEpisodeLine).join("\n\n") +
    `\n\n━━━━━━━━━━━━━━━━━━\n` +
    `Es wird noch nichts geändert.\n\n` +
    `Bestätigen mit:\n` +
    `/seriessplit ${parsed.groupQuery} ${parsed.clusterQuery} title ${parsed.newTitle} confirm`
  );
}

function buildSplitDoneMessage(parsed, result) {
  return (
    `✅ Serien-Cluster wurde getrennt.\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    `Neuer Serientitel:\n` +
    `${result.newLibrary.title}\n\n` +
    `Neue Library-ID:\n` +
    `${result.newLibrary.id}\n\n` +
    `Verschobene Folgen:\n` +
    `${result.updatedRows.length}\n\n` +
    `Prüfen mit:\n` +
    `/seriesclusters ${result.newLibrary.id}\n\n` +
    `Oder suchen:\n` +
    `/seriesaudit ${result.newLibrary.title}`
  );
}

async function handleSeriesSplitCommands(bot, msg, pgPool) {
  const text =
    String(msg.text || "").trim();

  const chatId =
    msg.chat.id;

  const from =
    msg.from;

  if (!from || !text) return false;

  if (!text.startsWith("/seriessplit ")) {
    return false;
  }

  if (!isAdmin(from.id)) {
    await bot.sendMessage(
      chatId,
      "⛔ Nur Admins können Serien-Cluster trennen.",
      {
        reply_to_message_id: msg.message_id
      }
    );

    return true;
  }

  const parsed =
    parseSeriesSplitCommand(text);

  if (!parsed || parsed.invalid) {
    await bot.sendMessage(
      chatId,
      `❌ Nutzung:\n\n` +
        `/seriessplit GRUPPE CLUSTER title NEUER TITEL\n` +
        `/seriessplit GRUPPE CLUSTER title NEUER TITEL confirm\n\n` +
        `Beispiele:\n` +
        `/seriessplit 1513 tih title Der unglaubliche Hulk TiH\n` +
        `/seriessplit 1513 the incredible hulk title The Incredible Hulk 1996`,
      {
        reply_to_message_id: msg.message_id
      }
    );

    return true;
  }

  const allRows =
    await getSeriesGroupRows(pgPool, parsed.groupQuery, 1000);

  const selectedRows =
    filterRowsByCluster(allRows, parsed.clusterQuery);

  if (!parsed.confirmed) {
    await bot.sendMessage(
      chatId,
      buildSplitPreviewMessage(parsed, allRows, selectedRows).slice(0, 3900),
      {
        reply_to_message_id: msg.message_id
      }
    );

    return true;
  }

  if (!allRows.length || !selectedRows.length) {
    await bot.sendMessage(
      chatId,
      buildSplitPreviewMessage(parsed, allRows, selectedRows).slice(0, 3900),
      {
        reply_to_message_id: msg.message_id
      }
    );

    return true;
  }

  const result =
    await splitSeriesCluster(
      pgPool,
      selectedRows,
      parsed.newTitle,
      from.id
    );

  await bot.sendMessage(
    chatId,
    result
      ? buildSplitDoneMessage(parsed, result)
      : "❌ Serien-Cluster konnte nicht getrennt werden.",
    {
      reply_to_message_id: msg.message_id
    }
  );

  return true;
}

module.exports = {
  handleSeriesSplitCommands,
};