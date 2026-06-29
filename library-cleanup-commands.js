const {
  isAdmin,
} = require("./access-control");

function pad2(value) {
  return String(value || 0).padStart(2, "0");
}

function formatMoviePreview(movie) {
  if (!movie) {
    return "Film nicht gefunden.";
  }

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
    `🎬 ${movie.title || "Unbekannter Film"}${movie.year ? ` (${movie.year})` : ""}\n` +
    `DB-ID: ${movie.id}\n` +
    `🆔 ${label}\n` +
    `${meta || "Keine technischen Daten"}\n` +
    `Datei: ${movie.file_name || "—"}`
  );
}

function formatEpisodePreview(episode) {
  if (!episode) {
    return "Folge nicht gefunden.";
  }

  return (
    `📺 ${episode.series_title || "Unbekannte Serie"} S${pad2(episode.season)}E${pad2(episode.episode)}\n` +
    `DB-ID: ${episode.id}\n` +
    `Titel: ${episode.episode_title || "—"}\n` +
    `Datei: ${episode.file_name || "—"}`
  );
}

async function getMovieById(pgPool, movieId) {
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
      file_name
    FROM movies
    WHERE id::text = $1::text
    LIMIT 1;
    `,
    [String(movieId)]
  );

  return result.rows[0] || null;
}

async function getEpisodeById(pgPool, episodeId) {
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
    WHERE id::text = $1::text
    LIMIT 1;
    `,
    [String(episodeId)]
  );

  return result.rows[0] || null;
}

async function softDeleteMovie(pgPool, movieId, deletedBy, reason = "manual cleanup") {
  const result = await pgPool.query(
    `
    WITH deleted AS (
      DELETE FROM movies
      WHERE id::text = $1::text
      RETURNING *
    )
    INSERT INTO deleted_library_items (
      item_type,
      item_ref,
      title,
      reason,
      item_data,
      deleted_by
    )
    SELECT
      'movie',
      deleted.id::text,
      deleted.title,
      $2,
      to_jsonb(deleted),
      $3
    FROM deleted
    RETURNING
      id,
      item_type,
      item_ref,
      title,
      reason,
      deleted_at;
    `,
    [
      String(movieId),
      reason,
      deletedBy
    ]
  );

  return result.rows[0] || null;
}

async function softDeleteEpisode(pgPool, episodeId, deletedBy, reason = "manual episode cleanup") {
  const result = await pgPool.query(
    `
    WITH deleted AS (
      DELETE FROM series
      WHERE id::text = $1::text
      RETURNING *
    )
    INSERT INTO deleted_library_items (
      item_type,
      item_ref,
      title,
      reason,
      item_data,
      deleted_by
    )
    SELECT
      'episode',
      deleted.id::text,
      deleted.series_title,
      $2,
      to_jsonb(deleted),
      $3
    FROM deleted
    RETURNING
      id,
      item_type,
      item_ref,
      title,
      reason,
      deleted_at;
    `,
    [
      String(episodeId),
      reason,
      deletedBy
    ]
  );

  return result.rows[0] || null;
}

async function getTrashList(pgPool, limit = 20) {
  const result = await pgPool.query(
    `
    SELECT
      id,
      item_type,
      item_ref,
      title,
      reason,
      deleted_by,
      deleted_at,
      restored_at
    FROM deleted_library_items
    WHERE restored_at IS NULL
    ORDER BY deleted_at DESC NULLS LAST, id DESC
    LIMIT $1;
    `,
    [
      Math.max(1, Math.min(Number(limit) || 20, 50))
    ]
  );

  return result.rows || [];
}

async function restoreMovieFromTrash(pgPool, trashId, restoredBy) {
  const result = await pgPool.query(
    `
    WITH item AS (
      SELECT
        id AS trash_id,
        item_data
      FROM deleted_library_items
      WHERE id::text = $1::text
        AND item_type = 'movie'
        AND restored_at IS NULL
      LIMIT 1
    ),
    restored AS (
      INSERT INTO movies
      SELECT *
      FROM jsonb_populate_record(NULL::movies, (SELECT item_data FROM item))
      ON CONFLICT DO NOTHING
      RETURNING id, title
    )
    UPDATE deleted_library_items
    SET
      restored_at = NOW(),
      restored_by = $2
    WHERE id = (SELECT trash_id FROM item)
      AND EXISTS (SELECT 1 FROM restored)
    RETURNING
      id,
      item_ref,
      title;
    `,
    [
      String(trashId),
      restoredBy
    ]
  );

  return result.rows[0] || null;
}

async function restoreEpisodeFromTrash(pgPool, trashId, restoredBy) {
  const result = await pgPool.query(
    `
    WITH item AS (
      SELECT
        id AS trash_id,
        item_data
      FROM deleted_library_items
      WHERE id::text = $1::text
        AND item_type = 'episode'
        AND restored_at IS NULL
      LIMIT 1
    ),
    restored AS (
      INSERT INTO series
      SELECT *
      FROM jsonb_populate_record(NULL::series, (SELECT item_data FROM item))
      ON CONFLICT DO NOTHING
      RETURNING id, series_title
    )
    UPDATE deleted_library_items
    SET
      restored_at = NOW(),
      restored_by = $2
    WHERE id = (SELECT trash_id FROM item)
      AND EXISTS (SELECT 1 FROM restored)
    RETURNING
      id,
      item_ref,
      title;
    `,
    [
      String(trashId),
      restoredBy
    ]
  );

  return result.rows[0] || null;
}

function buildTrashListMessage(rows) {
  if (!rows.length) {
    return (
      `🗑 Papierkorb\n` +
      `━━━━━━━━━━━━━━━━━━\n\n` +
      `Der Papierkorb ist leer.`
    );
  }

  const lines = rows.map((item, index) => {
    const icon =
      item.item_type === "movie"
        ? "🎬"
        : item.item_type === "episode"
          ? "📺"
          : "📦";

    const restoreCommand =
      item.item_type === "movie"
        ? `/restoremovie ${item.id}`
        : item.item_type === "episode"
          ? `/restoreepisode ${item.id}`
          : "—";

    return (
      `${index + 1}. ${icon} ${item.title || "Unbekannt"}\n` +
      `   Papierkorb-ID: ${item.id}\n` +
      `   Typ: ${item.item_type}\n` +
      `   Original-ID: ${item.item_ref}\n` +
      `   Grund: ${item.reason || "—"}\n` +
      `   Wiederherstellen: ${restoreCommand}`
    );
  }).join("\n\n");

  return (
    `🗑 Papierkorb\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    lines +
    `\n\n━━━━━━━━━━━━━━━━━━\n` +
    `Wiederherstellen mit:\n` +
    `/restoremovie PAPIERKORB_ID\n` +
    `/restoreepisode PAPIERKORB_ID`
  );
}

function parseDupeCleanup(text, commandName) {
  const regex = new RegExp(`^\\/${commandName}\\s+keep\\s+(\\d+)\\s+remove\\s+(\\d+)(\\s+confirm)?$`, "i");
  const match = text.match(regex);

  if (!match) {
    return null;
  }

  return {
    keepId: match[1],
    removeId: match[2],
    confirmed: Boolean(match[3])
  };
}

async function handleCleanupCommands(bot, msg, pgPool) {
  const text =
    String(msg.text || "").trim();

  const chatId =
    msg.chat.id;

  const from =
    msg.from;

  if (!from || !text) return false;

  const supported =
    text.startsWith("/trashmovie ") ||
    text.startsWith("/trashwrong ") ||
    text.startsWith("/trashepisode ") ||
    text.startsWith("/trashdupemovie ") ||
    text.startsWith("/trashdupeepisode ") ||
    text === "/trashlist" ||
    text.startsWith("/restoremovie ") ||
    text.startsWith("/restoreepisode ");

  if (!supported) {
    return false;
  }

  if (!isAdmin(from.id)) {
    await bot.sendMessage(
      chatId,
      "⛔ Nur Admins können Archiv-Einträge bereinigen.",
      {
        reply_to_message_id: msg.message_id
      }
    );

    return true;
  }

  if (text === "/trashlist") {
    const rows = await getTrashList(pgPool, 20);

    await bot.sendMessage(
      chatId,
      buildTrashListMessage(rows).slice(0, 3900),
      {
        reply_to_message_id: msg.message_id
      }
    );

    return true;
  }

  if (text.startsWith("/restoremovie ")) {
    const trashId =
      text.replace(/^\/restoremovie\s+/i, "").trim();

    if (!trashId || !/^\d+$/.test(trashId)) {
      await bot.sendMessage(
        chatId,
        "❌ Nutzung:\n/restoremovie PAPIERKORB_ID",
        {
          reply_to_message_id: msg.message_id
        }
      );

      return true;
    }

    const restored = await restoreMovieFromTrash(pgPool, trashId, from.id);

    await bot.sendMessage(
      chatId,
      restored
        ? (
            `✅ Film wurde wiederhergestellt.\n\n` +
            `Papierkorb-ID: ${restored.id}\n` +
            `Original-ID: ${restored.item_ref}\n` +
            `Titel: ${restored.title || "—"}`
          )
        : (
            `❌ Wiederherstellung nicht möglich.\n\n` +
            `Mögliche Gründe:\n` +
            `• Papierkorb-ID nicht gefunden\n` +
            `• Eintrag wurde bereits wiederhergestellt\n` +
            `• Original-ID existiert bereits wieder in movies`
          ),
      {
        reply_to_message_id: msg.message_id
      }
    );

    return true;
  }

  if (text.startsWith("/restoreepisode ")) {
    const trashId =
      text.replace(/^\/restoreepisode\s+/i, "").trim();

    if (!trashId || !/^\d+$/.test(trashId)) {
      await bot.sendMessage(
        chatId,
        "❌ Nutzung:\n/restoreepisode PAPIERKORB_ID",
        {
          reply_to_message_id: msg.message_id
        }
      );

      return true;
    }

    const restored = await restoreEpisodeFromTrash(pgPool, trashId, from.id);

    await bot.sendMessage(
      chatId,
      restored
        ? (
            `✅ Serienfolge wurde wiederhergestellt.\n\n` +
            `Papierkorb-ID: ${restored.id}\n` +
            `Original-ID: ${restored.item_ref}\n` +
            `Serie: ${restored.title || "—"}`
          )
        : (
            `❌ Wiederherstellung nicht möglich.\n\n` +
            `Mögliche Gründe:\n` +
            `• Papierkorb-ID nicht gefunden\n` +
            `• Eintrag wurde bereits wiederhergestellt\n` +
            `• Original-ID existiert bereits wieder in series`
          ),
      {
        reply_to_message_id: msg.message_id
      }
    );

    return true;
  }

  const movieDupe =
    parseDupeCleanup(text, "trashdupemovie");

  if (movieDupe) {
    const keepMovie = await getMovieById(pgPool, movieDupe.keepId);
    const removeMovie = await getMovieById(pgPool, movieDupe.removeId);

    if (!keepMovie || !removeMovie) {
      await bot.sendMessage(
        chatId,
        `❌ Mindestens eine Film-ID wurde nicht gefunden.\n\n` +
          `Behalten: ${movieDupe.keepId}\n` +
          `Entfernen: ${movieDupe.removeId}`,
        {
          reply_to_message_id: msg.message_id
        }
      );

      return true;
    }

    if (!movieDupe.confirmed) {
      await bot.sendMessage(
        chatId,
        `⚠️ Duplikat-Bereinigung Vorschau\n` +
          `━━━━━━━━━━━━━━━━━━\n\n` +
          `✅ Behalten:\n` +
          formatMoviePreview(keepMovie) +
          `\n\n🗑 In Papierkorb:\n` +
          formatMoviePreview(removeMovie) +
          `\n\n━━━━━━━━━━━━━━━━━━\n` +
          `Es wird noch nichts verschoben.\n\n` +
          `Bestätigen mit:\n` +
          `/trashdupemovie keep ${movieDupe.keepId} remove ${movieDupe.removeId} confirm`,
        {
          reply_to_message_id: msg.message_id
        }
      );

      return true;
    }

    const deleted = await softDeleteMovie(
      pgPool,
      movieDupe.removeId,
      from.id,
      `duplicate movie cleanup; kept ${movieDupe.keepId}`
    );

    await bot.sendMessage(
      chatId,
      deleted
        ? (
            `✅ Duplikat-Film wurde in den Papierkorb verschoben.\n\n` +
            `Behalten: ${movieDupe.keepId}\n` +
            `Entfernt: ${movieDupe.removeId}\n` +
            `Papierkorb-ID: ${deleted.id}\n\n` +
            `Wiederherstellen mit:\n` +
            `/restoremovie ${deleted.id}`
          )
        : `❌ Duplikat-Film konnte nicht verschoben werden.`,
      {
        reply_to_message_id: msg.message_id
      }
    );

    return true;
  }

  const episodeDupe =
    parseDupeCleanup(text, "trashdupeepisode");

  if (episodeDupe) {
    const keepEpisode = await getEpisodeById(pgPool, episodeDupe.keepId);
    const removeEpisode = await getEpisodeById(pgPool, episodeDupe.removeId);

    if (!keepEpisode || !removeEpisode) {
      await bot.sendMessage(
        chatId,
        `❌ Mindestens eine Folgen-ID wurde nicht gefunden.\n\n` +
          `Behalten: ${episodeDupe.keepId}\n` +
          `Entfernen: ${episodeDupe.removeId}`,
        {
          reply_to_message_id: msg.message_id
        }
      );

      return true;
    }

    if (!episodeDupe.confirmed) {
      await bot.sendMessage(
        chatId,
        `⚠️ Folgen-Duplikat Vorschau\n` +
          `━━━━━━━━━━━━━━━━━━\n\n` +
          `✅ Behalten:\n` +
          formatEpisodePreview(keepEpisode) +
          `\n\n🗑 In Papierkorb:\n` +
          formatEpisodePreview(removeEpisode) +
          `\n\n━━━━━━━━━━━━━━━━━━\n` +
          `Es wird noch nichts verschoben.\n\n` +
          `Bestätigen mit:\n` +
          `/trashdupeepisode keep ${episodeDupe.keepId} remove ${episodeDupe.removeId} confirm`,
        {
          reply_to_message_id: msg.message_id
        }
      );

      return true;
    }

    const deleted = await softDeleteEpisode(
      pgPool,
      episodeDupe.removeId,
      from.id,
      `duplicate episode cleanup; kept ${episodeDupe.keepId}`
    );

    await bot.sendMessage(
      chatId,
      deleted
        ? (
            `✅ Duplikat-Folge wurde in den Papierkorb verschoben.\n\n` +
            `Behalten: ${episodeDupe.keepId}\n` +
            `Entfernt: ${episodeDupe.removeId}\n` +
            `Papierkorb-ID: ${deleted.id}\n\n` +
            `Wiederherstellen mit:\n` +
            `/restoreepisode ${deleted.id}`
          )
        : `❌ Duplikat-Folge konnte nicht verschoben werden.`,
      {
        reply_to_message_id: msg.message_id
      }
    );

    return true;
  }

  if (text.startsWith("/trashepisode ")) {
    const raw =
      text.replace(/^\/trashepisode\s+/i, "").trim();

    const parts =
      raw.split(/\s+/);

    const episodeId =
      parts[0];

    const confirmed =
      parts.includes("confirm");

    if (!episodeId || !/^\d+$/.test(episodeId)) {
      await bot.sendMessage(
        chatId,
        `❌ Nutzung:\n` +
          `/trashepisode FOLGEN_ID\n` +
          `/trashepisode FOLGEN_ID confirm`,
        {
          reply_to_message_id: msg.message_id
        }
      );

      return true;
    }

    const episode =
      await getEpisodeById(pgPool, episodeId);

    if (!episode) {
      await bot.sendMessage(
        chatId,
        `❌ Folgen-ID ${episodeId} wurde nicht in der Serien-Tabelle gefunden.`,
        {
          reply_to_message_id: msg.message_id
        }
      );

      return true;
    }

    if (!confirmed) {
      await bot.sendMessage(
        chatId,
        `⚠️ Folgen-Papierkorb Vorschau\n` +
          `━━━━━━━━━━━━━━━━━━\n\n` +
          formatEpisodePreview(episode) +
          `\n\n━━━━━━━━━━━━━━━━━━\n` +
          `Es wird noch nichts gelöscht.\n\n` +
          `Zum Verschieben in den Papierkorb:\n` +
          `/trashepisode ${episodeId} confirm`,
        {
          reply_to_message_id: msg.message_id
        }
      );

      return true;
    }

    const deleted = await softDeleteEpisode(
      pgPool,
      episodeId,
      from.id,
      "manual episode cleanup"
    );

    await bot.sendMessage(
      chatId,
      deleted
        ? (
            `✅ Serienfolge wurde in den Papierkorb verschoben.\n\n` +
            `Papierkorb-ID: ${deleted.id}\n` +
            `Original-ID: ${deleted.item_ref}\n` +
            `Serie: ${deleted.title || "—"}\n\n` +
            `Wiederherstellen mit:\n` +
            `/restoreepisode ${deleted.id}`
          )
        : `❌ Serienfolge konnte nicht verschoben werden.`,
      {
        reply_to_message_id: msg.message_id
      }
    );

    return true;
  }

  if (text.startsWith("/trashmovie ") || text.startsWith("/trashwrong ")) {
    const isWrongImport =
      text.startsWith("/trashwrong ");

    const raw =
      text
        .replace(/^\/trashmovie\s+/i, "")
        .replace(/^\/trashwrong\s+/i, "")
        .trim();

    const parts =
      raw.split(/\s+/);

    const movieId =
      parts[0];

    const confirmed =
      parts.includes("confirm");

    if (!movieId || !/^\d+$/.test(movieId)) {
      await bot.sendMessage(
        chatId,
        `❌ Nutzung:\n` +
          `/trashmovie FILM_ID\n` +
          `/trashmovie FILM_ID confirm\n\n` +
          `Für Fehlimporte:\n` +
          `/trashwrong FILM_ID confirm`,
        {
          reply_to_message_id: msg.message_id
        }
      );

      return true;
    }

    const movie =
      await getMovieById(pgPool, movieId);

    if (!movie) {
      await bot.sendMessage(
        chatId,
        `❌ Film-ID ${movieId} wurde nicht in der Film-Tabelle gefunden.`,
        {
          reply_to_message_id: msg.message_id
        }
      );

      return true;
    }

    if (!confirmed) {
      await bot.sendMessage(
        chatId,
        `⚠️ Papierkorb-Vorschau\n` +
          `━━━━━━━━━━━━━━━━━━\n\n` +
          formatMoviePreview(movie) +
          `\n\n━━━━━━━━━━━━━━━━━━\n` +
          `Es wird noch nichts gelöscht.\n\n` +
          `Zum Verschieben in den Papierkorb:\n` +
          `/trashmovie ${movieId} confirm`,
        {
          reply_to_message_id: msg.message_id
        }
      );

      return true;
    }

    const deleted =
      await softDeleteMovie(
        pgPool,
        movieId,
        from.id,
        isWrongImport ? "wrong movie import" : "manual movie cleanup"
      );

    await bot.sendMessage(
      chatId,
      deleted
        ? (
            `✅ Film wurde in den Papierkorb verschoben.\n\n` +
            `Papierkorb-ID: ${deleted.id}\n` +
            `Original-ID: ${deleted.item_ref}\n` +
            `Titel: ${deleted.title || "—"}\n\n` +
            `Wiederherstellen mit:\n` +
            `/restoremovie ${deleted.id}`
          )
        : `❌ Film konnte nicht verschoben werden.`,
      {
        reply_to_message_id: msg.message_id
      }
    );

    return true;
  }

  return false;
}

module.exports = {
  handleCleanupCommands,
};