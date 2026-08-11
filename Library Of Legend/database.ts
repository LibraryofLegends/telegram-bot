/*
===============================================================================
                            PROJECT PHOENIX
===============================================================================
Component...........: Database
Architecture Layer..: Infrastructure
Module..............: Database
Module ID...........: LOL-MOD-DB-0001
LOL-ID..............: LOL-DB-CORE-0001
File................: database.ts
Location............: Library Of Legends/src/infrastructure/database/
Version.............: 1.0.0
Status..............: Core
Lifecycle...........: Production
Description.........: Single PostgreSQL connection and schema bootstrap.
===============================================================================
*/

import { Pool } from "pg";

export class Database {
  private readonly pool: Pool;

  public constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false }
    });
  }

  public get client(): Pool {
    return this.pool;
  }

  public async initialize(): Promise<void> {
    await this.pool.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS library_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        kind TEXT NOT NULL CHECK (kind IN ('MOVIE', 'EPISODE')),
        title TEXT NOT NULL,
        series_title TEXT,
        season INTEGER,
        episode INTEGER,
        episode_title TEXT,
        year INTEGER,
        file_name TEXT NOT NULL,
        file_id TEXT NOT NULL UNIQUE,
        file_size BIGINT,
        quality TEXT,
        source TEXT,
        audio TEXT,
        video_codec TEXT,
        genre TEXT DEFAULT 'Unbekannt',
        archive_id TEXT NOT NULL UNIQUE,
        telegram_chat_id TEXT,
        telegram_message_id INTEGER,
        views INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS series_topics (
        chat_id TEXT NOT NULL,
        normalized_name TEXT NOT NULL,
        topic_name TEXT NOT NULL,
        message_thread_id INTEGER NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (chat_id, normalized_name)
      );
    `);

    await this.pool.query(`
      CREATE INDEX IF NOT EXISTS idx_library_items_title
      ON library_items(title);
    `);

    await this.pool.query(`
      CREATE INDEX IF NOT EXISTS idx_library_items_series
      ON library_items(series_title);
    `);
  }

  public async close(): Promise<void> {
    await this.pool.end();
  }
}
