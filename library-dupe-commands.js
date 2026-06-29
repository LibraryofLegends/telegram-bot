const {
  isAdmin,
} = require("./access-control");

function normalizeTitle(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatMovieDupeLine(movie, index) {
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
    `${index + 1}. 🎬 ${movie.title || "Unbekannter Film"}${movie.year ? ` (${movie.year})` : ""}\n` +
    `   DB-ID: ${movie.id}\n` +
    `   🆔 ${label}\n` +
    `   ${meta || "Keine technischen Daten"}\n` +
    `   Datei: ${movie.file_name || "—"}\n` +
    `   Holen: !hol movie ${movie.id}`
  );
}

function formatSeriesDupeLine(item, index) {
  return (
    `${index + 1}. 📺 ${item.series_title || "Unbekannte Serie"} S${String(item.season || 0).padStart(2, "0")}E${String(item.episode || 0).padStart(2, "0")}\n` +
    `   DB-ID: ${item.id}\n` +
    `   Titel: ${item.episode_title || "—"}\n` +
    `   Qualität: ${item.quality || "—"} · ${item.resolution || "—"} · ${item.file_size || "—"}\n` +
    `   Datei: ${item.file_name || "—"}`
  );
}

async function getMovieDuplicateGroups(pgPool, limit = 20) {
  const result = await pgPool.query(
    `
    SELECT
      LOWER(REGEXP_REPLACE(TRIM(title), '\\s+', ' ', 'g')) AS title_key,
      COALESCE(year::text, '') AS year_key,
      MIN(title) AS display_title,
      year,
      COUNT(*)::int AS duplicate_count,
      ARRAY_AGG(id ORDER BY id ASC) AS ids
    FROM movies
    WHERE title IS NOT NULL
      AND TRIM(title) <> ''
    GROUP BY
      LOWER(REGEXP_REPLACE(TRIM(title), '\\s+', ' ', 'g')),
      COALESCE(year::text, ''),
      year
    HAVING COUNT(*) > 1
    ORDER BY
      duplicate_count DESC,
      display_title ASC
    LIMIT $1;
    `,
    [
      Math.max(1, Math.min(Number(limit) || 20, 50))
    ]
  );

  return result.rows || [];
}

async function getSeriesDuplicateGroups(pgPool, limit = 20) {
  const result = await pgPool.query(
    `
    SELECT
      LOWER(REGEXP_REPLACE(TRIM(series_title), '\\s+', ' ', 'g')) AS series_key,
      season::text AS season_key,
      episode::text AS episode_key,
      MIN(series_title) AS display_title,
      season,
      episode,
      COUNT(*)::int AS duplicate_count,
      ARRAY_AGG(id ORDER BY id ASC) AS ids
    FROM series
    WHERE series_title IS NOT NULL
      AND TRIM(series_title) <> ''
      AND season IS NOT NULL
      AND episode IS NOT NULL
    GROUP BY
      LOWER(REGEXP_REPLACE(TRIM(series_title), '\\s+', ' ', 'g')),
      season::text,
      episode::text,
      season,
      episode
    HAVING COUNT(*) > 1
    ORDER BY
      duplicate_count DESC,
      display_title ASC,
      season ASC,
      episode ASC
    LIMIT $1;
    `,
    [
      Math.max(1, Math.min(Number(limit) || 20, 50))
    ]
  );

  return result.rows || [];
}

function buildDuplicateOverviewMessage(movieGroups, seriesGroups) {
  const movieLines =
    movieGroups.length
      ? movieGroups.map((group, index) => {
          return (
            `${index + 1}. 🎬 ${group.display_title}${group.year ? ` (${group.year})` : ""}\n` +
            `   ${group.duplicate_count}x vorhanden\n` +
            `   IDs: ${(group.ids || []).join(", ")}\n` +
            `   Details: /dupe ${group.display_title}`
          );
        }).join("\n\n")
      : "Keine Film-Duplikate gefunden.";

  const seriesLines =
    seriesGroups.length
      ? seriesGroups.map((group, index) => {
          return (
            `${index + 1}. 📺 ${group.display_title} S${String(group.season || 0).padStart(2, "0")}E${String(group.episode || 0).padStart(2, "0")}\n` +
            `   ${group.duplicate_count}x vorhanden\n` +
            `   IDs: ${(group.ids || []).join(", ")}`
          );
        }).join("\n\n")
      : "Keine Serienfolgen-Duplikate gefunden.";

  return (
    `🧹 Duplikat-Scanner\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    `🎬 Filme\n\n` +
    movieLines +
    `\n\n━━━━━━━━━━━━━━━━━━\n\n` +
    `📺 Serienfolgen\n\n` +
    seriesLines +
    `\n\n━━━━━━━━━━━━━━━━━━\n` +
    `Hinweis: Es wird nichts automatisch gelöscht.\n\n` +
    `Details suchen:\n` +
    `/dupe TITEL`
  );
}

async function findMovieDupesByTitle(pgPool, query) {
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
      title ILIKE $1
      OR file_name ILIKE $1
    ORDER BY
      title ASC,
      year ASC NULLS LAST,
      quality DESC NULLS LAST,
      resolution DESC NULLS LAST,
      id ASC
    LIMIT 30;
    `,
    [
      `%${query}%`
    ]
  );

  return result.rows || [];
}

async function findSeriesDupesByTitle(pgPool, query) {
  const result = await pgPool.query(
    `
    SELECT
      id,
      series_title,
      season,
      episode,
      episode_title,
      NULL::text AS quality,
      NULL::text AS resolution,
      NULL::text AS file_size,
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
    LIMIT 40;
    `,
    [
      `%${query}%`
    ]
  );

  return result.rows || [];
}

function buildDupeDetailMessage(query, movies, series) {
  const normalizedMap = new Map();

  for (const movie of movies) {
    const key = `${normalizeTitle(movie.title)}|${movie.year || ""}`;
    const current = normalizedMap.get(key) || [];
    current.push(movie);
    normalizedMap.set(key, current);
  }

  const exactMovieDupes = Array.from(normalizedMap.values())
    .filter((items) => items.length > 1)
    .flat();

  const movieList =
    exactMovieDupes.length
      ? exactMovieDupes.map(formatMovieDupeLine).join("\n\n")
      : (
          movies.length
            ? movies.map(formatMovieDupeLine).join("\n\n")
            : "Keine Filme gefunden."
        );

  const seriesMap = new Map();

  for (const item of series) {
    const key = `${normalizeTitle(item.series_title)}|${item.season}|${item.episode}`;
    const current = seriesMap.get(key) || [];
    current.push(item);
    seriesMap.set(key, current);
  }

  const exactSeriesDupes = Array.from(seriesMap.values())
    .filter((items) => items.length > 1)
    .flat();

  const seriesList =
    exactSeriesDupes.length
      ? exactSeriesDupes.map(formatSeriesDupeLine).join("\n\n")
      : (
          series.length
            ? series.map(formatSeriesDupeLine).join("\n\n")
            : "Keine Serienfolgen gefunden."
        );

  return (
    `🔎 Duplikat-Details\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    `Suche: ${query}\n\n` +
    `🎬 Filme\n\n` +
    movieList +
    `\n\n━━━━━━━━━━━━━━━━━━\n\n` +
    `📺 Serienfolgen\n\n` +
    seriesList +
    `\n\n━━━━━━━━━━━━━━━━━━\n` +
    `Löschen bleibt manuell über deine bestehenden Admin-Befehle.`
  );
}

async function handleDupeCommands(bot, msg, pgPool) {
  const text =
    String(msg.text || "").trim();

  const chatId =
    msg.chat.id;

  const from =
    msg.from;

  if (!from || !text) return false;

  const supported =
    text === "/dupes" ||
    text === "/dupes movies" ||
    text === "/dupes filme" ||
    text === "/dupes series" ||
    text === "/dupes serien" ||
    text.startsWith("/dupe ");

  if (!supported) {
    return false;
  }

  if (!isAdmin(from.id)) {
    await bot.sendMessage(
      chatId,
      "⛔ Nur Admins können den Duplikat-Scanner nutzen.",
      {
        reply_to_message_id: msg.message_id
      }
    );

    return true;
  }

  if (text === "/dupes") {
    const movieGroups = await getMovieDuplicateGroups(pgPool, 10);
    const seriesGroups = await getSeriesDuplicateGroups(pgPool, 10);

    await bot.sendMessage(
      chatId,
      buildDuplicateOverviewMessage(movieGroups, seriesGroups).slice(0, 3900),
      {
        reply_to_message_id: msg.message_id
      }
    );

    return true;
  }

  if (text === "/dupes movies" || text === "/dupes filme") {
    const movieGroups = await getMovieDuplicateGroups(pgPool, 25);

    const message =
      `🎬 Film-Duplikate\n` +
      `━━━━━━━━━━━━━━━━━━\n\n` +
      (
        movieGroups.length
          ? movieGroups.map((group, index) => {
              return (
                `${index + 1}. ${group.display_title}${group.year ? ` (${group.year})` : ""}\n` +
                `   ${group.duplicate_count}x vorhanden\n` +
                `   IDs: ${(group.ids || []).join(", ")}\n` +
                `   Details: /dupe ${group.display_title}`
              );
            }).join("\n\n")
          : "Keine Film-Duplikate gefunden."
      );

    await bot.sendMessage(
      chatId,
      message.slice(0, 3900),
      {
        reply_to_message_id: msg.message_id
      }
    );

    return true;
  }

  if (text === "/dupes series" || text === "/dupes serien") {
    const seriesGroups = await getSeriesDuplicateGroups(pgPool, 25);

    const message =
      `📺 Serienfolgen-Duplikate\n` +
      `━━━━━━━━━━━━━━━━━━\n\n` +
      (
        seriesGroups.length
          ? seriesGroups.map((group, index) => {
              return (
                `${index + 1}. ${group.display_title} S${String(group.season || 0).padStart(2, "0")}E${String(group.episode || 0).padStart(2, "0")}\n` +
                `   ${group.duplicate_count}x vorhanden\n` +
                `   IDs: ${(group.ids || []).join(", ")}`
              );
            }).join("\n\n")
          : "Keine Serienfolgen-Duplikate gefunden."
      );

    await bot.sendMessage(
      chatId,
      message.slice(0, 3900),
      {
        reply_to_message_id: msg.message_id
      }
    );

    return true;
  }

  if (text.startsWith("/dupe ")) {
    const query =
      text.replace(/^\/dupe\s+/i, "").trim();

    if (!query) {
      await bot.sendMessage(
        chatId,
        "❌ Nutzung:\n/dupe TITEL",
        {
          reply_to_message_id: msg.message_id
        }
      );

      return true;
    }

    const movies = await findMovieDupesByTitle(pgPool, query);
    const series = await findSeriesDupesByTitle(pgPool, query);

    await bot.sendMessage(
      chatId,
      buildDupeDetailMessage(query, movies, series).slice(0, 3900),
      {
        reply_to_message_id: msg.message_id
      }
    );

    return true;
  }

  return false;
}

module.exports = {
  handleDupeCommands,
};