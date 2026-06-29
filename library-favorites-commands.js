const {
  isAdmin,
  requireApprovedUser,
} = require("./access-control");

function cleanFavoriteText(text = "") {
  return String(text || "").trim();
}

function isLibraryMovieRef(value = "") {
  return /^LIB-[A-Z0-9]+-\d+$/i.test(String(value || "").trim());
}

async function findMovie(pgPool, movieRef) {
  const refText = String(movieRef || "").trim();

  if (!refText) return null;

  let result;

  if (/^\d+$/.test(refText)) {
    result = await pgPool.query(
      `
      SELECT id, title, year, library_id
      FROM movies
      WHERE id::text = $1::text
      LIMIT 1;
      `,
      [refText]
    );
  } else if (isLibraryMovieRef(refText)) {
    result = await pgPool.query(
      `
      SELECT id, title, year, library_id
      FROM movies
      WHERE LOWER(library_id::text) = LOWER($1::text)
      LIMIT 1;
      `,
      [refText]
    );
  } else {
    result = await pgPool.query(
      `
      SELECT id, title, year, library_id
      FROM movies
      WHERE
        LOWER(title) = LOWER($1)
        OR title ILIKE $2
        OR file_name ILIKE $2
      ORDER BY
        CASE
          WHEN LOWER(title) = LOWER($1) THEN 0
          WHEN LOWER(title) LIKE LOWER($3) THEN 1
          ELSE 2
        END,
        year NULLS LAST,
        title ASC
      LIMIT 2;
      `,
      [refText, `%${refText}%`, `${refText}%`]
    );
  }

  const rows = result.rows || [];

  if (rows.length !== 1) {
    return {
      found: false,
      multiple: rows.length > 1,
      rows
    };
  }

  return {
    found: true,
    multiple: false,
    item: rows[0]
  };
}

async function findSeries(pgPool, seriesRef) {
  const refText = String(seriesRef || "").trim();

  if (!refText) return null;

  let result;

  if (/^\d+$/.test(refText)) {
    result = await pgPool.query(
      `
      SELECT
        COALESCE(NULLIF(MAX(series_library_id::text), ''), MIN(id)::text) AS item_ref,
        series_title AS title,
        MIN(id) AS id
      FROM series
      WHERE
        series_library_id::text = $1::text
        OR id::text = $1::text
      GROUP BY series_title
      LIMIT 1;
      `,
      [refText]
    );
  } else {
    result = await pgPool.query(
      `
      SELECT
        COALESCE(NULLIF(MAX(series_library_id::text), ''), MIN(id)::text) AS item_ref,
        series_title AS title,
        MIN(id) AS id
      FROM series
      WHERE
        LOWER(series_title) = LOWER($1)
        OR series_title ILIKE $2
      GROUP BY series_title
      ORDER BY
        CASE
          WHEN LOWER(series_title) = LOWER($1) THEN 0
          WHEN LOWER(series_title) LIKE LOWER($3) THEN 1
          ELSE 2
        END,
        series_title ASC
      LIMIT 2;
      `,
      [refText, `%${refText}%`, `${refText}%`]
    );
  }

  const rows = result.rows || [];

  if (rows.length !== 1) {
    return {
      found: false,
      multiple: rows.length > 1,
      rows
    };
  }

  return {
    found: true,
    multiple: false,
    item: rows[0]
  };
}

async function addFavorite(pgPool, telegramUserId, itemType, itemRef, title, year = null) {
  const result = await pgPool.query(
    `
    INSERT INTO user_favorites (
      telegram_user_id,
      item_type,
      item_ref,
      title,
      year
    )
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (telegram_user_id, item_type, item_ref)
    DO UPDATE SET
      title = EXCLUDED.title,
      year = EXCLUDED.year
    RETURNING *;
    `,
    [
      telegramUserId,
      itemType,
      String(itemRef),
      title || null,
      year || null
    ]
  );

  return result.rows[0];
}

async function removeFavorite(pgPool, telegramUserId, itemRef) {
  const result = await pgPool.query(
    `
    DELETE FROM user_favorites
    WHERE
      telegram_user_id = $1
      AND item_ref::text = $2::text
    RETURNING *;
    `,
    [
      telegramUserId,
      String(itemRef)
    ]
  );

  return result.rows || [];
}

async function clearFavorites(pgPool, telegramUserId) {
  const result = await pgPool.query(
    `
    DELETE FROM user_favorites
    WHERE telegram_user_id = $1
    RETURNING *;
    `,
    [telegramUserId]
  );

  return result.rows || [];
}

async function getFavorites(pgPool, telegramUserId) {
  const result = await pgPool.query(
    `
    SELECT
      id,
      item_type,
      item_ref,
      title,
      year,
      created_at
    FROM user_favorites
    WHERE telegram_user_id = $1
    ORDER BY created_at DESC
    LIMIT 50;
    `,
    [telegramUserId]
  );

  return result.rows || [];
}

function formatFavoriteLine(item, index) {
  if (item.item_type === "movie") {
    return (
      `${index}. 🎬 ${item.title || "Unbekannter Film"}${item.year ? ` (${item.year})` : ""}\n` +
      `   🆔 ${item.item_ref}\n` +
      `   !hol movie ${item.item_ref}`
    );
  }

  return (
    `${index}. 📺 ${item.title || "Unbekannte Serie"}\n` +
    `   🆔 ${item.item_ref}\n` +
    `   !hol serie ${item.item_ref} s1e1\n` +
    `   !hol serie ${item.item_ref} staffel 1`
  );
}

function buildFavoritesMessage(items) {
  if (!items.length) {
    return (
      `⭐ Deine Merkliste\n` +
      `━━━━━━━━━━━━━━━━━━\n\n` +
      `Deine Merkliste ist leer.\n\n` +
      `Etwas merken mit:\n` +
      `!merken movie 167\n` +
      `!merken LIB-ACT-0001\n` +
      `!merken tulsa king`
    );
  }

  return (
    `⭐ Deine Merkliste\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    items.map(formatFavoriteLine).join("\n\n") +
    `\n\n━━━━━━━━━━━━━━━━━━\n` +
    `Entfernen mit:\n` +
    `!vergessen ID\n\n` +
    `Alles löschen:\n` +
    `!merkliste leeren`
  );
}

async function handleFavoriteCommands(bot, msg, pgPool) {
  const text = cleanFavoriteText(msg.text || "");
  const chatId = msg.chat.id;
  const from = msg.from;

  if (!from || !text) return false;

  const supported =
    text.startsWith("!merken") ||
    text.startsWith("/merken") ||
    text === "!merkliste" ||
    text === "/merkliste" ||
    text === "!favorites" ||
    text === "/favorites" ||
    text.startsWith("!vergessen") ||
    text.startsWith("/vergessen") ||
    text === "!merkliste leeren" ||
    text === "/merkliste leeren";

  if (!supported) return false;

  const userCheck = await requireApprovedUser(pgPool, from.id);

  if (!isAdmin(from.id) && !userCheck.ok) {
    await bot.sendMessage(chatId, userCheck.message, {
      reply_to_message_id: msg.message_id
    });
    return true;
  }

  if (
    text === "!merkliste" ||
    text === "/merkliste" ||
    text === "!favorites" ||
    text === "/favorites"
  ) {
    const items = await getFavorites(pgPool, from.id);

    await bot.sendMessage(
      chatId,
      buildFavoritesMessage(items).slice(0, 3900),
      {
        reply_to_message_id: msg.message_id
      }
    );

    return true;
  }

  if (text === "!merkliste leeren" || text === "/merkliste leeren") {
    const deleted = await clearFavorites(pgPool, from.id);

    await bot.sendMessage(
      chatId,
      `🧹 Merkliste geleert.\n\n` +
        `Entfernt: ${deleted.length}`,
      {
        reply_to_message_id: msg.message_id
      }
    );

    return true;
  }

  if (text.startsWith("!vergessen") || text.startsWith("/vergessen")) {
    const itemRef = text.replace(/^(!vergessen|\/vergessen)/i, "").trim();

    if (!itemRef) {
      await bot.sendMessage(
        chatId,
        `❌ Nutzung:\n!vergessen ID`,
        {
          reply_to_message_id: msg.message_id
        }
      );
      return true;
    }

    const deleted = await removeFavorite(pgPool, from.id, itemRef);

    await bot.sendMessage(
      chatId,
      deleted.length
        ? `✅ Aus Merkliste entfernt:\n${itemRef}`
        : `❌ Nicht in deiner Merkliste gefunden:\n${itemRef}`,
      {
        reply_to_message_id: msg.message_id
      }
    );

    return true;
  }

  if (text.startsWith("!merken") || text.startsWith("/merken")) {
    const raw = text.replace(/^(!merken|\/merken)/i, "").trim();

    if (!raw) {
      await bot.sendMessage(
        chatId,
        `❌ Nutzung:\n\n` +
          `!merken movie 167\n` +
          `!merken LIB-ACT-0001\n` +
          `!merken oblivion\n` +
          `!merken serie tulsa king`,
        {
          reply_to_message_id: msg.message_id
        }
      );
      return true;
    }

    const parts = raw.split(/\s+/);
    const first = parts[0]?.toLowerCase();

    let type = "movie";
    let ref = raw;

    if (["serie", "series", "show"].includes(first)) {
      type = "series";
      ref = parts.slice(1).join(" ").trim();
    }

    if (["movie", "film"].includes(first)) {
      type = "movie";
      ref = parts.slice(1).join(" ").trim();
    }

    if (!ref) {
      await bot.sendMessage(
        chatId,
        `❌ Kein Titel oder Code angegeben.`,
        {
          reply_to_message_id: msg.message_id
        }
      );
      return true;
    }

    if (type === "movie") {
      const found = await findMovie(pgPool, ref);

      if (!found || !found.found) {
        await bot.sendMessage(
          chatId,
          found?.multiple
            ? `⚠️ Mehrere Filme gefunden. Bitte nutze erst:\n!suche ${ref}`
            : `❌ Film nicht gefunden:\n${ref}`,
          {
            reply_to_message_id: msg.message_id
          }
        );
        return true;
      }

      const movie = found.item;
      const itemRef = movie.id;

      await addFavorite(
        pgPool,
        from.id,
        "movie",
        itemRef,
        movie.title,
        movie.year
      );

      await bot.sendMessage(
        chatId,
        `⭐ Gemerkt:\n\n` +
          `🎬 ${movie.title}${movie.year ? ` (${movie.year})` : ""}\n` +
          `📦 Holen mit:\n!hol movie ${movie.id}`,
        {
          reply_to_message_id: msg.message_id
        }
      );

      return true;
    }

    if (type === "series") {
      const found = await findSeries(pgPool, ref);

      if (!found || !found.found) {
        await bot.sendMessage(
          chatId,
          found?.multiple
            ? `⚠️ Mehrere Serien gefunden. Bitte nutze erst:\n!suche ${ref}`
            : `❌ Serie nicht gefunden:\n${ref}`,
          {
            reply_to_message_id: msg.message_id
          }
        );
        return true;
      }

      const series = found.item;
      const itemRef = series.item_ref || series.id;

      await addFavorite(
        pgPool,
        from.id,
        "series",
        itemRef,
        series.title,
        null
      );

      await bot.sendMessage(
        chatId,
        `⭐ Gemerkt:\n\n` +
          `📺 ${series.title}\n` +
          `📦 Holen mit:\n!hol serie ${itemRef} s1e1`,
        {
          reply_to_message_id: msg.message_id
        }
      );

      return true;
    }
  }

  return false;
}

module.exports = {
  handleFavoriteCommands,
};