const {
  isAdmin,
  requireApprovedUser,
} = require("./access-control");

function pad2(value) {
  return String(value || 0).padStart(2, "0");
}

function parseSeasonList(value) {
  if (Array.isArray(value)) {
    return value
      .map((v) => Number(String(v).trim()))
      .filter((n) => Number.isInteger(n) && n > 0)
      .sort((a, b) => a - b);
  }

  return String(value || "")
    .split(",")
    .map((v) => Number(String(v).trim()))
    .filter((n) => Number.isInteger(n) && n > 0)
    .sort((a, b) => a - b);
}

function formatMovieLine(movie, index) {
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
    `${index}. 🎬 ${movie.title || "Unbekannter Film"}${movie.year ? ` (${movie.year})` : ""}\n` +
    `   🆔 ${label}\n` +
    `   ${meta || "Keine technischen Daten"}\n` +
    `   !hol movie ${movie.id}`
  );
}

function formatSeriesLine(series, index) {
  const number =
    series.series_ref ||
    series.series_library_id ||
    series.id;

  const seasons =
    parseSeasonList(series.season_list);

  const firstSeason =
    seasons[0] ||
    series.first_season ||
    1;

  const seasonText =
    seasons.length
      ? seasons.map((s) => `S${pad2(s)}`).join(", ")
      : "—";

  return (
    `${index}. 📺 ${series.series_title || "Unbekannte Serie"}${series.release_year ? ` (${series.release_year})` : ""}\n` +
    `   ${series.seasons_count || 0} Staffel(n) · ${series.episodes_count || 0} Folge(n)\n` +
    `   Staffeln: ${seasonText}\n` +
    `   !hol serie ${number} s${firstSeason}e1\n` +
    `   !hol serie ${number} staffel ${firstSeason}`
  );
}

function parseYear(value = "") {
  const match = String(value || "").match(/\b(19\d{2}|20\d{2})\b/);

  if (!match) return null;

  const year = Number(match[1]);

  if (!Number.isInteger(year) || year < 1900 || year > 2099) {
    return null;
  }

  return year;
}

function parseDecade(value = "") {
  const clean = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");

  let match = clean.match(/^(19\d{2}|20\d{2})er$/);

  if (match) {
    const start = Number(match[1]);
    return {
      start,
      end: start + 9,
      label: `${start}er`
    };
  }

  match = clean.match(/^(\d{2})er$/);

  if (match) {
    const short = Number(match[1]);

    let start;

    if (short >= 30 && short <= 99) {
      start = 1900 + short;
    } else {
      start = 2000 + short;
    }

    return {
      start,
      end: start + 9,
      label: `${start}er`
    };
  }

  match = clean.match(/^(\d{2})s$/);

  if (match) {
    const short = Number(match[1]);

    let start;

    if (short >= 30 && short <= 99) {
      start = 1900 + short;
    } else {
      start = 2000 + short;
    }

    return {
      start,
      end: start + 9,
      label: `${start}er`
    };
  }

  return null;
}

async function getYearOverview(pgPool) {
  const moviesResult = await pgPool.query(`
    SELECT
      year::text AS release_year,
      COUNT(*)::int AS movie_count
    FROM movies
    WHERE year IS NOT NULL
      AND year::text ~ '^[0-9]{4}$'
    GROUP BY year::text;
  `);

  const seriesResult = await pgPool.query(`
    SELECT
      release_year,
      COUNT(*)::int AS series_count
    FROM (
      SELECT DISTINCT
        COALESCE(NULLIF(s.series_library_id::text, ''), LOWER(s.series_title)) AS series_key,
        LEFT(NULLIF(sl.first_air_date::text, ''), 4) AS release_year
      FROM series s
      LEFT JOIN series_library sl
        ON s.series_library_id::text = sl.id::text
      WHERE LEFT(NULLIF(sl.first_air_date::text, ''), 4) ~ '^[0-9]{4}$'
    ) x
    GROUP BY release_year;
  `);

  const map = new Map();

  for (const row of moviesResult.rows || []) {
    const year = row.release_year;

    map.set(year, {
      year,
      movies: Number(row.movie_count || 0),
      series: 0
    });
  }

  for (const row of seriesResult.rows || []) {
    const year = row.release_year;

    const current = map.get(year) || {
      year,
      movies: 0,
      series: 0
    };

    current.series = Number(row.series_count || 0);
    map.set(year, current);
  }

  return Array.from(map.values())
    .sort((a, b) => Number(b.year) - Number(a.year))
    .slice(0, 60);
}

function buildYearOverviewMessage(rows) {
  if (!rows.length) {
    return (
      `📅 Jahre im Archiv\n` +
      `━━━━━━━━━━━━━━━━━━\n\n` +
      `Noch keine Jahresdaten gefunden.`
    );
  }

  const lines = rows
    .map((row) => {
      const parts = [];

      if (row.movies) {
        parts.push(`🎬 ${row.movies}`);
      }

      if (row.series) {
        parts.push(`📺 ${row.series}`);
      }

      return `${row.year} · ${parts.join(" · ") || "0"}`;
    })
    .join("\n");

  return (
    `📅 Jahre im Archiv\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    lines +
    `\n\n━━━━━━━━━━━━━━━━━━\n` +
    `Stöbern mit:\n` +
    `!jahr 2025\n` +
    `!jahr 1994\n` +
    `!dekade 90er\n` +
    `!dekade 2000er`
  );
}

async function getMoviesByYear(pgPool, year, limit = 15) {
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
      created_at
    FROM movies
    WHERE year::text = $1::text
    ORDER BY
      title ASC,
      id ASC
    LIMIT $2;
    `,
    [
      String(year),
      Math.max(1, Math.min(Number(limit) || 15, 20))
    ]
  );

  return result.rows || [];
}

async function getMoviesByDecade(pgPool, startYear, endYear, limit = 15) {
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
      created_at
    FROM movies
    WHERE year::text ~ '^[0-9]{4}$'
      AND year::int BETWEEN $1 AND $2
    ORDER BY
      year ASC,
      title ASC,
      id ASC
    LIMIT $3;
    `,
    [
      startYear,
      endYear,
      Math.max(1, Math.min(Number(limit) || 15, 20))
    ]
  );

  return result.rows || [];
}

async function getSeriesByYear(pgPool, year, limit = 10) {
  const result = await pgPool.query(
    `
    SELECT
      MIN(s.id) AS id,
      COALESCE(NULLIF(MAX(s.series_library_id::text), ''), MIN(s.id)::text) AS series_ref,
      MAX(s.series_library_id::text) AS series_library_id,
      s.series_title,
      LEFT(NULLIF(MAX(sl.first_air_date::text), ''), 4) AS release_year,
      COUNT(*)::int AS episodes_count,
      COUNT(DISTINCT s.season::text)::int AS seasons_count,
      ARRAY_AGG(DISTINCT s.season::text) AS season_list,
      MIN(
        CASE
          WHEN s.season::text ~ '^[0-9]+$'
          THEN s.season::integer
          ELSE NULL
        END
      ) AS first_season
    FROM series s
    LEFT JOIN series_library sl
      ON s.series_library_id::text = sl.id::text
    WHERE LEFT(NULLIF(sl.first_air_date::text, ''), 4) = $1::text
    GROUP BY
      COALESCE(NULLIF(s.series_library_id::text, ''), LOWER(s.series_title)),
      s.series_title
    ORDER BY
      s.series_title ASC
    LIMIT $2;
    `,
    [
      String(year),
      Math.max(1, Math.min(Number(limit) || 10, 20))
    ]
  );

  return result.rows || [];
}

async function getSeriesByDecade(pgPool, startYear, endYear, limit = 10) {
  const result = await pgPool.query(
    `
    SELECT
      MIN(s.id) AS id,
      COALESCE(NULLIF(MAX(s.series_library_id::text), ''), MIN(s.id)::text) AS series_ref,
      MAX(s.series_library_id::text) AS series_library_id,
      s.series_title,
      LEFT(NULLIF(MAX(sl.first_air_date::text), ''), 4) AS release_year,
      COUNT(*)::int AS episodes_count,
      COUNT(DISTINCT s.season::text)::int AS seasons_count,
      ARRAY_AGG(DISTINCT s.season::text) AS season_list,
      MIN(
        CASE
          WHEN s.season::text ~ '^[0-9]+$'
          THEN s.season::integer
          ELSE NULL
        END
      ) AS first_season
    FROM series s
    LEFT JOIN series_library sl
      ON s.series_library_id::text = sl.id::text
    WHERE LEFT(NULLIF(sl.first_air_date::text, ''), 4) ~ '^[0-9]{4}$'
      AND LEFT(NULLIF(sl.first_air_date::text, ''), 4)::int BETWEEN $1 AND $2
    GROUP BY
      COALESCE(NULLIF(s.series_library_id::text, ''), LOWER(s.series_title)),
      s.series_title
    ORDER BY
      release_year ASC,
      s.series_title ASC
    LIMIT $3;
    `,
    [
      startYear,
      endYear,
      Math.max(1, Math.min(Number(limit) || 10, 20))
    ]
  );

  return result.rows || [];
}

function buildYearBrowseMessage({ title, movies, series, searchHint }) {
  let message =
    `${title}\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    `🎬 Filme\n\n` +
    (
      movies.length
        ? movies.map(formatMovieLine).join("\n\n")
        : "Keine Filme gefunden."
    ) +
    `\n\n━━━━━━━━━━━━━━━━━━\n\n` +
    `📺 Serien\n\n` +
    (
      series.length
        ? series.map(formatSeriesLine).join("\n\n")
        : "Keine Serien gefunden."
    ) +
    `\n\n━━━━━━━━━━━━━━━━━━\n` +
    `🔎 Mehr finden mit:\n` +
    searchHint;

  return message;
}

async function sendYearOverviewMessage(bot, chatId, replyToMessageId, pgPool) {
  const rows = await getYearOverview(pgPool);

  await bot.sendMessage(
    chatId,
    buildYearOverviewMessage(rows).slice(0, 3900),
    {
      reply_to_message_id: replyToMessageId
    }
  );
}

async function sendYearBrowseMessage(bot, chatId, replyToMessageId, pgPool, year) {
  const movies = await getMoviesByYear(pgPool, year, 15);
  const series = await getSeriesByYear(pgPool, year, 10);

  await bot.sendMessage(
    chatId,
    buildYearBrowseMessage({
      title: `📅 Jahr ${year}`,
      movies,
      series,
      searchHint: `!suche ${year}`
    }).slice(0, 3900),
    {
      reply_to_message_id: replyToMessageId
    }
  );
}

async function sendDecadeBrowseMessage(bot, chatId, replyToMessageId, pgPool, decade) {
  const movies = await getMoviesByDecade(pgPool, decade.start, decade.end, 15);
  const series = await getSeriesByDecade(pgPool, decade.start, decade.end, 10);

  await bot.sendMessage(
    chatId,
    buildYearBrowseMessage({
      title: `📅 ${decade.label}`,
      movies,
      series,
      searchHint: `!suche ${decade.start}`
    }).slice(0, 3900),
    {
      reply_to_message_id: replyToMessageId
    }
  );
}

function parseYearCommand(text = "") {
  const clean = String(text || "").trim();
  const lower = clean.toLowerCase();

  if (
    lower === "!jahre" ||
    lower === "/jahre" ||
    lower === "!years" ||
    lower === "/years"
  ) {
    return {
      type: "overview"
    };
  }

  const directYear = clean.match(/^!(19\d{2}|20\d{2})$/);

  if (directYear) {
    return {
      type: "year",
      year: Number(directYear[1])
    };
  }

  const yearMatch = clean.match(/^(!jahr|\/jahr|!year|\/year)\s+(19\d{2}|20\d{2})$/i);

  if (yearMatch) {
    return {
      type: "year",
      year: Number(yearMatch[2])
    };
  }

  const directDecade = clean.match(/^!(\d{2}er|19\d{2}er|20\d{2}er|\d{2}s)$/i);

  if (directDecade) {
    const decade = parseDecade(directDecade[1]);

    if (decade) {
      return {
        type: "decade",
        decade
      };
    }
  }

  const decadeMatch = clean.match(/^(!dekade|\/dekade|!decade|\/decade)\s+(.+)$/i);

  if (decadeMatch) {
    const decade = parseDecade(decadeMatch[2]);

    if (decade) {
      return {
        type: "decade",
        decade
      };
    }
  }

  return null;
}

async function handleYearCommands(bot, msg, pgPool) {
  const text =
    String(msg.text || "").trim();

  const chatId =
    msg.chat.id;

  const from =
    msg.from;

  if (!from || !text) return false;

  const parsed = parseYearCommand(text);

  if (!parsed) {
    return false;
  }

  const userCheck = await requireApprovedUser(pgPool, from.id);

  if (!isAdmin(from.id) && !userCheck.ok) {
    await bot.sendMessage(chatId, userCheck.message, {
      reply_to_message_id: msg.message_id
    });
    return true;
  }

  if (parsed.type === "overview") {
    await sendYearOverviewMessage(
      bot,
      chatId,
      msg.message_id,
      pgPool
    );

    return true;
  }

  if (parsed.type === "year") {
    await sendYearBrowseMessage(
      bot,
      chatId,
      msg.message_id,
      pgPool,
      parsed.year
    );

    return true;
  }

  if (parsed.type === "decade") {
    await sendDecadeBrowseMessage(
      bot,
      chatId,
      msg.message_id,
      pgPool,
      parsed.decade
    );

    return true;
  }

  return false;
}

module.exports = {
  handleYearCommands,
  sendYearOverviewMessage,
};