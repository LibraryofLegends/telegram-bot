"use strict";

const {
  sqlite: db,
  postgres: pgPool,
  hasPostgres
} = require("./connection");

/*
|--------------------------------------------------------------------------
| LOGS
|--------------------------------------------------------------------------
*/

async function logToDb(type, message) {
  if (hasPostgres()) {
    await pgPool.query(
      `
      INSERT INTO logs(type,message)
      VALUES($1,$2)
      `,
      [type, message]
    );
    return;
  }

  db.prepare(
    `
    INSERT INTO logs(type,message)
    VALUES(?,?)
    `
  ).run(type, message);
}

/*
|--------------------------------------------------------------------------
| TOPICS
|--------------------------------------------------------------------------
*/

async function getTopic(name) {
  if (hasPostgres()) {
    const result = await pgPool.query(
      `
      SELECT topic_id
      FROM topics
      WHERE name=$1
      `,
      [name]
    );

    return result.rows[0]?.topic_id || null;
  }

  const row = db.prepare(
    `
    SELECT topic_id
    FROM topics
    WHERE name=?
    `
  ).get(name);

  return row?.topic_id || null;
}

async function saveTopic(name, topicId) {
  if (hasPostgres()) {
    await pgPool.query(
      `
      INSERT INTO topics(name,topic_id)
      VALUES($1,$2)
      ON CONFLICT(name)
      DO UPDATE SET topic_id=EXCLUDED.topic_id
      `,
      [name, topicId]
    );

    return;
  }

  db.prepare(
    `
    INSERT OR REPLACE INTO topics(name,topic_id)
    VALUES(?,?)
    `
  ).run(name, topicId);
}

/*
|--------------------------------------------------------------------------
| KNOWLEDGE
|--------------------------------------------------------------------------
*/

async function saveKnowledge(title, caption) {
  if (hasPostgres()) {
    await pgPool.query(
      `
      INSERT INTO knowledge(title,caption)
      VALUES($1,$2)
      ON CONFLICT(title)
      DO UPDATE SET caption=EXCLUDED.caption
      `,
      [title, caption]
    );

    return;
  }

  db.prepare(
    `
    INSERT OR REPLACE INTO knowledge(title,caption)
    VALUES(?,?)
    `
  ).run(title, caption);
}

async function knowledgeCaption(title) {
  if (hasPostgres()) {
    const result = await pgPool.query(
      `
      SELECT caption
      FROM knowledge
      WHERE title=$1
      `,
      [title]
    );

    return result.rows[0]?.caption || null;
  }

  const row = db.prepare(
    `
    SELECT caption
    FROM knowledge
    WHERE title=?
    `
  ).get(title);

  return row?.caption || null;
}

async function movieExists(uniqueKey) {

  if (hasPostgres()) {

    const result = await pgPool.query(
      `
      SELECT *
      FROM movies
      WHERE unique_key = $1
      LIMIT 1
      `,
      [uniqueKey]
    );

    return result.rows[0] || null;
  }

  return db.prepare(`
    SELECT *
    FROM movies
    WHERE unique_key = ?
  `).get(uniqueKey);
}

async function saveMovie(data) {

  if (hasPostgres()) {

    return await pgPool.query(
      `
      INSERT INTO movies
      (
        title,
        year,
        genre,
        rating,
        runtime,
        overview,

        poster_url,

        file_name,
        file_id,
        unique_key,

        telegram_message_id,
        topic_id,

        collection,
        quality,
        audio,
        source,

        fsk,
        director,
        cast_list,

        library_id,

        resolution,
        file_size,
        file_size_bytes,

        video_codec,
        audio_codec,
        audio_channels,

        hdr,

        universe,
        universe_phase,
        starwars_era
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,
        $7,
        $8,$9,$10,
        $11,$12,
        $13,$14,$15,$16,
        $17,$18,$19,
        $20,
        $21,$22,$23,
        $24,$25,$26,
        $27,
        $28,$29,$30
      )
      ON CONFLICT (unique_key)
      DO NOTHING
      `,
      [
        data.title,
        data.year,
        data.genre,
        data.rating,
        data.runtime,
        data.overview,

        data.posterUrl,

        data.fileName,
        data.fileId,
        data.uniqueKey,

        data.telegramMessageId,
        data.topicId,

        data.collection,
        data.quality,
        data.audio,
        data.source,

        data.fsk,
        data.director,
        data.cast,

        data.libraryId,

        data.resolution,
        data.fileSize,
        data.fileSizeBytes,

        data.videoCodec,
        data.audioCodec,
        data.audioChannels,

        data.hdr,

        data.universe,
        data.universePhase,
        data.starWarsEra
      ]
    );
  }

  return db.prepare(`
    INSERT OR IGNORE INTO movies
    (
      title, year, genre, rating, runtime, overview,
      poster_url, file_name, file_id, unique_key,
      telegram_message_id, topic_id,
      collection, quality, audio, source,
      fsk, director, cast, library_id,
      resolution, file_size, file_size_bytes,
      video_codec, audio_codec, audio_channels,
      hdr,
      universe, universe_phase, starwars_era
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.title,
    data.year,
    data.genre,
    data.rating,
    data.runtime,
    data.overview,

    data.posterUrl,

    data.fileName,
    data.fileId,
    data.uniqueKey,

    data.telegramMessageId,
    data.topicId,

    data.collection,
    data.quality,
    data.audio,
    data.source,

    data.fsk,
    data.director,
    data.cast,

    data.libraryId,

    data.resolution,
    data.fileSize,
    data.fileSizeBytes,

    data.videoCodec,
    data.audioCodec,
    data.audioChannels,

    data.hdr,

    data.universe,
    data.universePhase,
    data.starWarsEra
  );
}

async function seriesExists(uniqueKey) {
  if (hasPostgres()) {
    const result = await pgPool.query(
      `
      SELECT *
      FROM series
      WHERE unique_key = $1
      LIMIT 1
      `,
      [uniqueKey]
    );

    return result.rows[0] || null;
  }

  return db.prepare(`
    SELECT *
    FROM series
    WHERE unique_key = ?
  `).get(uniqueKey);
}

async function saveSeries(data) {
  if (hasPostgres()) {
    return await pgPool.query(
      `
      INSERT INTO series
      (
        series_title,
        season,
        episode,
        episode_title,
        genre,
        rating,
        overview,
        poster_url,
        file_name,
        file_id,
        unique_key,
        telegram_message_id,
        topic_id,
        series_library_id,
        universe,
        universe_phase,
        starwars_era
      )
      VALUES (
        $1, $2, $3, $4,
        $5, $6, $7, $8,
        $9, $10, $11,
        $12, $13,
        $14,
        $15, $16, $17
      )
      ON CONFLICT (unique_key)
      DO NOTHING
      `,
      [
        data.seriesTitle || null,
        data.season || null,
        data.episode || null,
        data.episodeTitle || null,
        data.genre || null,
        data.rating || null,
        data.overview || null,
        data.posterUrl || null,
        data.fileName || null,
        data.fileId || null,
        data.uniqueKey || null,
        data.telegramMessageId || null,
        data.topicId || null,
        data.seriesLibraryId || null,
        data.universe || null,
        data.universePhase || null,
        data.starWarsEra || null
      ]
    );
  }

  return db.prepare(`
    INSERT OR IGNORE INTO series
    (
      series_title,
      season,
      episode,
      episode_title,
      genre,
      rating,
      overview,
      poster_url,
      file_name,
      file_id,
      unique_key,
      telegram_message_id,
      topic_id,
      series_library_id,
      universe,
      universe_phase,
      starwars_era
    )
    VALUES (
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?,
      ?,
      ?, ?, ?
    )
  `).run(
    data.seriesTitle || null,
    data.season || null,
    data.episode || null,
    data.episodeTitle || null,
    data.genre || null,
    data.rating || null,
    data.overview || null,
    data.posterUrl || null,
    data.fileName || null,
    data.fileId || null,
    data.uniqueKey || null,
    data.telegramMessageId || null,
    data.topicId || null,
    data.seriesLibraryId || null,
    data.universe || null,
    data.universePhase || null,
    data.starWarsEra || null
  );
}

module.exports = {
  logToDb,
  getTopic,
  saveTopic,
  saveKnowledge,
  knowledgeCaption,
  movieExists,
  saveMovie,
  seriesExists,
  saveSeries,
};

