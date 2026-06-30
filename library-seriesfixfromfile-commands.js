const {
  isAdmin,
} = require("./access-control");

function pad2(value) {
  return String(value || 0).padStart(2, "0");
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

function stripExtension(fileName = "") {
  return String(fileName || "").replace(/\.[a-z0-9]{2,5}$/i, "");
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

function extractTitleFromFileName(fileName = "") {
  const base =
    stripExtension(fileName)
      .replace(/[_]+/g, " ")
      .replace(/[.]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const patterns = [
    /S\s*\d{1,2}\s*E\s*\d{1,3}\s*[-–—]\s*(.+)$/i,
    /S\d{1,2}E\d{1,3}\s*[-–—]\s*(.+)$/i,
    /\d{1,2}\s*x\s*\d{1,3}\s*[-–—]\s*(.+)$/i,
    /\d{1,2}\s*x\s*\d{1,3}\s+(.+)$/i
  ];

  for (const pattern of patterns) {
    const match = base.match(pattern);

    if (match?.[1]) {
      return match[1]
        .replace(/@.+$/i, "")
        .replace(/\s+/g, " ")
        .trim();
    }
  }

  return null;
}

async function getSeriesRowsForFix(pgPool, query, limit = 1000) {
  const cleanQuery =
    String(query || "").trim();

  const cleanLimit =
    Math.max(1, Math.min(Number(limit) || 1000, 3000));

  if (/^\d+$/.test(cleanQuery)) {
    const libraryResult = await pgPool.query(
      `
      SELECT COUNT(*)::int AS count
      FROM series
      WHERE series_library_id::text = $1::text;
      `,
      [
        cleanQuery
      ]
    );

    if (Number(libraryResult.rows[0]?.count || 0) > 0) {
      const rowsResult = await pgPool.query(
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
          cleanQuery,
          cleanLimit
        ]
      );

      return rowsResult.rows || [];
    }

    const baseResult = await pgPool.query(
      `
      SELECT
        id,
        series_library_id,
        series_title
      FROM series
      WHERE id::text = $1::text
      LIMIT 1;
      `,
      [
        cleanQuery
      ]
    );

    const base =
      baseResult.rows[0];

    if (base?.series_library_id) {
      const rowsResult = await pgPool.query(
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

      return rowsResult.rows || [];
    }

    if (base?.series_title) {
      const rowsResult = await pgPool.query(
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

      return rowsResult.rows || [];
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

function buildFixCandidates(rows) {
  return rows
    .map((row) => {
      const fileInfo =
        parseEpisodeFromFileName(row.file_name);

      if (!fileInfo) {
        return null;
      }

      const fileTitle =
        extractTitleFromFileName(row.file_name);

      const dbSeason =
        Number(row.season || 0);

      const dbEpisode =
        Number(row.episode || 0);

      const titleChanged =
        fileTitle &&
        normalizeText(fileTitle) !== normalizeText(row.episode_title);

      const numberChanged =
        dbSeason !== fileInfo.season ||
        dbEpisode !== fileInfo.episode;

      if (!numberChanged && !titleChanged) {
        return null;
      }

      return {
        row,
        id: row.id,
        oldSeason: dbSeason,
        oldEpisode: dbEpisode,
        oldTitle: row.episode_title,
        newSeason: fileInfo.season,
        newEpisode: fileInfo.episode,
        newTitle: fileTitle || row.episode_title,
        fileName: row.file_name
      };
    })
    .filter(Boolean);
}

function analyzeCandidates(rows, candidates) {
  const candidateIds =
    new Set(candidates.map((candidate) => String(candidate.id)));

  const targetCounts =
    new Map();

  for (const candidate of candidates) {
    const key =
      `${candidate.newSeason}|${candidate.newEpisode}`;

    targetCounts.set(
      key,
      (targetCounts.get(key) || 0) + 1
    );
  }

  const currentRowsByKey =
    new Map();

  for (const row of rows) {
    const key =
      `${Number(row.season || 0)}|${Number(row.episode || 0)}`;

    const current =
      currentRowsByKey.get(key) || [];

    current.push(row);
    currentRowsByKey.set(key, current);
  }

  const safe = [];
  const blocked = [];

  for (const candidate of candidates) {
    const targetKey =
      `${candidate.newSeason}|${candidate.newEpisode}`;

    const reasons = [];

    if ((targetCounts.get(targetKey) || 0) > 1) {
      reasons.push(
        `Mehrere Dateien zeigen auf ${formatEpisodeCode(candidate.newSeason, candidate.newEpisode)}`
      );
    }

    const occupants =
      (currentRowsByKey.get(targetKey) || [])
        .filter((row) => String(row.id) !== String(candidate.id))
        .filter((row) => !candidateIds.has(String(row.id)));

    if (occupants.length) {
      reasons.push(
        `Ziel-Folge existiert bereits: ${occupants.map((row) => `DB-ID ${row.id}`).join(", ")}`
      );
    }

    if (reasons.length) {
      blocked.push({
        ...candidate,
        reasons
      });
    } else {
      safe.push(candidate);
    }
  }

  return {
    safe,
    blocked
  };
}

function formatCandidateLine(candidate, index) {
  return (
    `${index + 1}. DB-ID ${candidate.id}\n` +
    `   Von: ${formatEpisodeCode(candidate.oldSeason, candidate.oldEpisode)} · ${candidate.oldTitle || "—"}\n` +
    `   Nach: ${formatEpisodeCode(candidate.newSeason, candidate.newEpisode)} · ${candidate.newTitle || "—"}\n` +
    `   Datei: ${candidate.fileName || "—"}`
  );
}

function formatBlockedLine(candidate, index) {
  return (
    `${index + 1}. ⛔ DB-ID ${candidate.id}\n` +
    `   Von: ${formatEpisodeCode(candidate.oldSeason, candidate.oldEpisode)}\n` +
    `   Nach: ${formatEpisodeCode(candidate.newSeason, candidate.newEpisode)}\n` +
    `   Grund: ${candidate.reasons.join(" | ")}\n` +
    `   Datei: ${candidate.fileName || "—"}`
  );
}

function buildPreviewMessage(query, rows, candidates, analysis) {
  if (!rows.length) {
    return (
      `🧰 Serien-Batch-Reparatur\n` +
      `━━━━━━━━━━━━━━━━━━\n\n` +
      `Keine Folgen gefunden für:\n` +
      `${query}`
    );
  }

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

  const safeText =
    analysis.safe.length
      ? analysis.safe.slice(0, 15).map(formatCandidateLine).join("\n\n")
      : "Keine sicheren Änderungen gefunden.";

  const blockedText =
    analysis.blocked.length
      ? analysis.blocked.slice(0, 10).map(formatBlockedLine).join("\n\n")
      : "Keine blockierten Änderungen.";

  return (
    `🧰 Serien-Batch-Reparatur\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    `Gruppe: ${query}\n` +
    `Serientitel: ${titles.slice(0, 3).join(" / ") || "—"}\n` +
    `Library-ID(s): ${libraryIds.join(", ") || "—"}\n` +
    `Folgen gesamt: ${rows.length}\n` +
    `Kandidaten: ${candidates.length}\n` +
    `Sicher reparierbar: ${analysis.safe.length}\n` +
    `Blockiert: ${analysis.blocked.length}\n\n` +

    `✅ Sichere Änderungen\n\n` +
    safeText +
    `\n\n━━━━━━━━━━━━━━━━━━\n\n` +

    `⛔ Blockiert\n\n` +
    blockedText +
    `\n\n━━━━━━━━━━━━━━━━━━\n` +
    `Es wird noch nichts geändert.\n\n` +
    `Bestätigen mit:\n` +
    `/seriesfixfromfile ${query} confirm\n\n` +
    `Hinweis: Confirm repariert nur sichere Änderungen. Blockierte Einträge bleiben unverändert.`
  );
}

async function updateSeriesLibraryCounters(client, libraryId) {
  try {
    await client.query(
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

async function applySafeFixes(pgPool, safeCandidates, editedBy) {
  const client =
    await pgPool.connect();

  const updated = [];

  try {
    await client.query("BEGIN");

    for (const candidate of safeCandidates) {
      const beforeResult = await client.query(
        `
        SELECT *
        FROM series
        WHERE id::text = $1::text
        LIMIT 1;
        `,
        [
          String(candidate.id)
        ]
      );

      const before =
        beforeResult.rows[0];

      if (!before) {
        continue;
      }

      const updateResult = await client.query(
        `
        UPDATE series
        SET
          season = $2,
          episode = $3,
          episode_title = COALESCE(NULLIF($4, ''), episode_title)
        WHERE id::text = $1::text
        RETURNING *;
        `,
        [
          String(candidate.id),
          candidate.newSeason,
          candidate.newEpisode,
          candidate.newTitle || null
        ]
      );

      const after =
        updateResult.rows[0];

      if (after) {
        updated.push(after);

        try {
          await client.query(
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
              'episode',
              $1,
              'series_fix_from_file',
              $2::jsonb,
              $3::jsonb,
              $4
            );
            `,
            [
              String(candidate.id),
              JSON.stringify(before),
              JSON.stringify(after),
              editedBy
            ]
          );
        } catch (err) {
          console.warn("⚠️ Edit-Log konnte nicht geschrieben werden:", err.message);
        }
      }
    }

    const libraryIds =
      Array.from(
        new Set(
          updated
            .map((row) => row.series_library_id)
            .filter(Boolean)
            .map(String)
        )
      );

    for (const libraryId of libraryIds) {
      await updateSeriesLibraryCounters(client, libraryId);
    }

    await client.query("COMMIT");

    return updated;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

function buildDoneMessage(query, updated, blocked) {
  return (
    `✅ Serien-Batch-Reparatur abgeschlossen.\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    `Gruppe: ${query}\n` +
    `Aktualisierte Folgen: ${updated.length}\n` +
    `Blockiert / übersprungen: ${blocked.length}\n\n` +
    `Prüfen mit:\n` +
    `/seriesaudit ${query}\n\n` +
    `Falls du mit Library-ID geprüft hast:\n` +
    `/seriesaudit ${updated[0]?.series_title || query}`
  );
}

function parseSeriesFixCommand(text = "") {
  const clean =
    String(text || "").trim();

  if (!clean.startsWith("/seriesfixfromfile ")) {
    return null;
  }

  const raw =
    clean.replace(/^\/seriesfixfromfile\s+/i, "").trim();

  const parts =
    raw.split(/\s+/);

  const last =
    String(parts[parts.length - 1] || "").toLowerCase();

  const action =
    last === "preview" || last === "confirm"
      ? last
      : "preview";

  const query =
    (action === "preview" || action === "confirm") && parts.length > 1 && (last === "preview" || last === "confirm")
      ? parts.slice(0, -1).join(" ").trim()
      : parts.join(" ").trim();

  if (!query) {
    return {
      invalid: true
    };
  }

  return {
    query,
    action
  };
}

async function handleSeriesFixFromFileCommands(bot, msg, pgPool) {
  const text =
    String(msg.text || "").trim();

  const chatId =
    msg.chat.id;

  const from =
    msg.from;

  if (!from || !text) return false;

  if (!text.startsWith("/seriesfixfromfile ")) {
    return false;
  }

  if (!isAdmin(from.id)) {
    await bot.sendMessage(
      chatId,
      "⛔ Nur Admins können Serien-Batch-Reparaturen ausführen.",
      {
        reply_to_message_id: msg.message_id
      }
    );

    return true;
  }

  const parsed =
    parseSeriesFixCommand(text);

  if (!parsed || parsed.invalid) {
    await bot.sendMessage(
      chatId,
      `❌ Nutzung:\n\n` +
        `/seriesfixfromfile LIBRARY_ID\n` +
        `/seriesfixfromfile LIBRARY_ID preview\n` +
        `/seriesfixfromfile LIBRARY_ID confirm\n\n` +
        `Beispiel:\n` +
        `/seriesfixfromfile 1691 preview`,
      {
        reply_to_message_id: msg.message_id
      }
    );

    return true;
  }

  const rows =
    await getSeriesRowsForFix(pgPool, parsed.query, 1000);

  const candidates =
    buildFixCandidates(rows);

  const analysis =
    analyzeCandidates(rows, candidates);

  if (parsed.action !== "confirm") {
    await bot.sendMessage(
      chatId,
      buildPreviewMessage(parsed.query, rows, candidates, analysis).slice(0, 3900),
      {
        reply_to_message_id: msg.message_id
      }
    );

    return true;
  }

  if (!analysis.safe.length) {
    await bot.sendMessage(
      chatId,
      `⛔ Keine sicheren Änderungen vorhanden.\n\n` +
        `Nutze zuerst:\n` +
        `/seriesfixfromfile ${parsed.query} preview`,
      {
        reply_to_message_id: msg.message_id
      }
    );

    return true;
  }

  const updated =
    await applySafeFixes(
      pgPool,
      analysis.safe,
      from.id
    );

  await bot.sendMessage(
    chatId,
    buildDoneMessage(parsed.query, updated, analysis.blocked).slice(0, 3900),
    {
      reply_to_message_id: msg.message_id
    }
  );

  return true;
}

module.exports = {
  handleSeriesFixFromFileCommands,
};