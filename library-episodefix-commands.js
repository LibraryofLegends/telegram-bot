const {
  isAdmin,
} = require("./access-control");

function pad2(value) {
  return String(value || 0).padStart(2, "0");
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

function stripExtension(fileName = "") {
  return String(fileName || "").replace(/\.[a-z0-9]{2,5}$/i, "");
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

function formatEpisodeCode(season, episode) {
  return `S${pad2(season)}E${pad2(episode)}`;
}

async function getEpisodeById(pgPool, episodeId) {
  const result = await pgPool.query(
    `
    SELECT *
    FROM series
    WHERE id::text = $1::text
    LIMIT 1;
    `,
    [String(episodeId)]
  );

  return result.rows[0] || null;
}

async function findEpisodeConflict(pgPool, episode, newSeason, newEpisode) {
  const result = await pgPool.query(
    `
    SELECT
      id,
      series_title,
      season,
      episode,
      episode_title,
      file_name
    FROM series
    WHERE id::text <> $1::text
      AND LOWER(series_title) = LOWER($2)
      AND season::text = $3::text
      AND episode::text = $4::text
    ORDER BY id ASC
    LIMIT 5;
    `,
    [
      String(episode.id),
      String(episode.series_title || ""),
      String(newSeason),
      String(newEpisode)
    ]
  );

  return result.rows || [];
}

function buildEpisodeFixPreviewMessage({
  episode,
  newSeason,
  newEpisode,
  newTitle,
  conflicts,
  confirmCommand
}) {
  const oldCode =
    formatEpisodeCode(episode.season, episode.episode);

  const newCode =
    formatEpisodeCode(newSeason, newEpisode);

  const conflictText =
    conflicts.length
      ? (
          `\n\n⚠️ Konflikt erkannt\n` +
          conflicts.map((item, index) => {
            return (
              `${index + 1}. DB-ID ${item.id} · ${formatEpisodeCode(item.season, item.episode)}\n` +
              `   Titel: ${item.episode_title || "—"}\n` +
              `   Datei: ${item.file_name || "—"}`
            );
          }).join("\n\n") +
          `\n\nDiese Ziel-Folge existiert bereits. Deshalb wird ohne Bestätigung nichts geändert.`
        )
      : "";

  return (
    `🛠 Episoden-Reparatur Vorschau\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    `📺 ${episode.series_title || "Unbekannte Serie"}\n` +
    `DB-ID: ${episode.id}\n\n` +

    `Aktuell:\n` +
    `${oldCode}\n` +
    `Titel: ${episode.episode_title || "—"}\n` +
    `Datei: ${episode.file_name || "—"}\n\n` +

    `Neu:\n` +
    `${newCode}\n` +
    `Titel: ${newTitle || episode.episode_title || "—"}\n` +
    conflictText +
    `\n\n━━━━━━━━━━━━━━━━━━\n` +
    `Es wird noch nichts geändert.\n\n` +
    `Bestätigen mit:\n` +
    confirmCommand
  );
}

function buildEpisodeFixDoneMessage(before, after) {
  return (
    `✅ Episode wurde aktualisiert.\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    `📺 ${after.series_title || before.series_title}\n` +
    `DB-ID: ${after.id}\n\n` +
    `Vorher:\n` +
    `${formatEpisodeCode(before.season, before.episode)} · ${before.episode_title || "—"}\n\n` +
    `Nachher:\n` +
    `${formatEpisodeCode(after.season, after.episode)} · ${after.episode_title || "—"}`
  );
}

async function updateEpisode(pgPool, episodeId, newSeason, newEpisode, newTitle, editedBy) {
  const before =
    await getEpisodeById(pgPool, episodeId);

  if (!before) {
    return null;
  }

  const updatedResult = await pgPool.query(
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
      String(episodeId),
      newSeason,
      newEpisode,
      newTitle || null
    ]
  );

  const after =
    updatedResult.rows[0] || null;

  if (after) {
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
        'episode',
        $1,
        'episode_fix',
        $2,
        $3,
        $4
      );
      `,
      [
        String(episodeId),
        before,
        after,
        editedBy
      ]
    );
  }

  return {
    before,
    after
  };
}

function parseEpisodeFixCommand(text = "") {
  const clean =
    String(text || "").trim();

  if (!clean.startsWith("/episodefix ")) {
    return null;
  }

  const raw =
    clean.replace(/^\/episodefix\s+/i, "").trim();

  const parts =
    raw.split(/\s+/);

  const episodeId =
    parts[0];

  if (!episodeId || !/^\d+$/.test(episodeId)) {
    return {
      invalid: true
    };
  }

  const confirmed =
    parts.includes("confirm");

  const mode =
    parts.includes("file")
      ? "file"
      : "manual";

  if (mode === "file") {
    return {
      episodeId,
      mode,
      confirmed
    };
  }

  const seasonIndex =
    parts.findIndex((p) => p.toLowerCase() === "season");

  const episodeIndex =
    parts.findIndex((p) => p.toLowerCase() === "episode");

  if (seasonIndex >= 0 && episodeIndex >= 0) {
    const newSeason =
      Number(parts[seasonIndex + 1]);

    const newEpisode =
      Number(parts[episodeIndex + 1]);

    const titleIndex =
      parts.findIndex((p) => p.toLowerCase() === "title");

    const newTitle =
      titleIndex >= 0
        ? parts
            .slice(titleIndex + 1)
            .filter((p) => p.toLowerCase() !== "confirm")
            .join(" ")
            .trim()
        : null;

    return {
      episodeId,
      mode,
      newSeason,
      newEpisode,
      newTitle,
      confirmed
    };
  }

  return {
    episodeId,
    mode: "preview"
  };
}

async function handleEpisodeFixCommands(bot, msg, pgPool) {
  const text =
    String(msg.text || "").trim();

  const chatId =
    msg.chat.id;

  const from =
    msg.from;

  if (!from || !text) return false;

  if (!text.startsWith("/episodefix ")) {
    return false;
  }

  if (!isAdmin(from.id)) {
    await bot.sendMessage(
      chatId,
      "⛔ Nur Admins können Episoden reparieren.",
      {
        reply_to_message_id: msg.message_id
      }
    );

    return true;
  }

  const parsed =
    parseEpisodeFixCommand(text);

  if (!parsed || parsed.invalid) {
    await bot.sendMessage(
      chatId,
      `❌ Nutzung:\n\n` +
        `/episodefix ID\n` +
        `/episodefix ID file\n` +
        `/episodefix ID file confirm\n\n` +
        `Manuell:\n` +
        `/episodefix ID season 1 episode 3\n` +
        `/episodefix ID season 1 episode 3 title Episodentitel\n` +
        `/episodefix ID season 1 episode 3 confirm`,
      {
        reply_to_message_id: msg.message_id
      }
    );

    return true;
  }

  const episode =
    await getEpisodeById(pgPool, parsed.episodeId);

  if (!episode) {
    await bot.sendMessage(
      chatId,
      `❌ Episode ${parsed.episodeId} wurde nicht gefunden.`,
      {
        reply_to_message_id: msg.message_id
      }
    );

    return true;
  }

  if (parsed.mode === "preview") {
    const fileInfo =
      parseEpisodeFromFileName(episode.file_name);

    const fileTitle =
      extractTitleFromFileName(episode.file_name);

    await bot.sendMessage(
      chatId,
      `🛠 Episoden-Reparatur\n` +
        `━━━━━━━━━━━━━━━━━━\n\n` +
        `📺 ${episode.series_title || "Unbekannte Serie"}\n` +
        `DB-ID: ${episode.id}\n\n` +
        `DB:\n` +
        `${formatEpisodeCode(episode.season, episode.episode)}\n` +
        `Titel: ${episode.episode_title || "—"}\n\n` +
        `Datei:\n` +
        `${fileInfo ? formatEpisodeCode(fileInfo.season, fileInfo.episode) : "Keine SxxExx-Angabe erkannt"}\n` +
        `Titel aus Datei: ${fileTitle || "—"}\n` +
        `${episode.file_name || "—"}\n\n` +
        `Aus Datei übernehmen:\n` +
        `/episodefix ${episode.id} file\n\n` +
        `Manuell setzen:\n` +
        `/episodefix ${episode.id} season 1 episode 3`,
      {
        reply_to_message_id: msg.message_id
      }
    );

    return true;
  }

  let newSeason =
    parsed.newSeason;

  let newEpisode =
    parsed.newEpisode;

  let newTitle =
    parsed.newTitle || null;

  if (parsed.mode === "file") {
    const fileInfo =
      parseEpisodeFromFileName(episode.file_name);

    if (!fileInfo) {
      await bot.sendMessage(
        chatId,
        `❌ Aus dem Dateinamen konnte keine SxxExx-Angabe gelesen werden.\n\n` +
          `Datei:\n${episode.file_name || "—"}`,
        {
          reply_to_message_id: msg.message_id
        }
      );

      return true;
    }

    newSeason =
      fileInfo.season;

    newEpisode =
      fileInfo.episode;

    newTitle =
      extractTitleFromFileName(episode.file_name) || episode.episode_title;
  }

  if (
    !Number.isInteger(Number(newSeason)) ||
    !Number.isInteger(Number(newEpisode)) ||
    Number(newSeason) <= 0 ||
    Number(newEpisode) <= 0
  ) {
    await bot.sendMessage(
      chatId,
      `❌ Ungültige Staffel/Folge.\n\n` +
        `Beispiel:\n` +
        `/episodefix ${episode.id} season 1 episode 3`,
      {
        reply_to_message_id: msg.message_id
      }
    );

    return true;
  }

  newSeason = Number(newSeason);
  newEpisode = Number(newEpisode);

  const conflicts =
    await findEpisodeConflict(pgPool, episode, newSeason, newEpisode);

  const confirmCommand =
    parsed.mode === "file"
      ? `/episodefix ${episode.id} file confirm`
      : `/episodefix ${episode.id} season ${newSeason} episode ${newEpisode}${newTitle ? ` title ${newTitle}` : ""} confirm`;

  if (!parsed.confirmed) {
    await bot.sendMessage(
      chatId,
      buildEpisodeFixPreviewMessage({
        episode,
        newSeason,
        newEpisode,
        newTitle,
        conflicts,
        confirmCommand
      }).slice(0, 3900),
      {
        reply_to_message_id: msg.message_id
      }
    );

    return true;
  }

  if (conflicts.length) {
    await bot.sendMessage(
      chatId,
      `⛔ Reparatur blockiert.\n\n` +
        `Die Ziel-Folge ${formatEpisodeCode(newSeason, newEpisode)} existiert bereits.\n\n` +
        `Nutze zuerst den Duplikat-/Papierkorb-Workflow oder prüfe die Serie genauer.`,
      {
        reply_to_message_id: msg.message_id
      }
    );

    return true;
  }

  const updated =
    await updateEpisode(
      pgPool,
      episode.id,
      newSeason,
      newEpisode,
      newTitle,
      from.id
    );

  await bot.sendMessage(
    chatId,
    updated?.after
      ? buildEpisodeFixDoneMessage(updated.before, updated.after)
      : "❌ Episode konnte nicht aktualisiert werden.",
    {
      reply_to_message_id: msg.message_id
    }
  );

  return true;
}

module.exports = {
  handleEpisodeFixCommands,
};