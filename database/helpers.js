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

module.exports = {
  logToDb,
  getTopic,
  saveTopic,
  saveKnowledge,
  knowledgeCaption
};