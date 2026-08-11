/*
===============================================================================
                            PROJECT PHOENIX
===============================================================================
Component...........: LibraryRepository
Architecture Layer..: Infrastructure
Module..............: Database
Module ID...........: LOL-MOD-DB-0002
LOL-ID..............: LOL-DB-LIBRARY-0001
File................: library-repository.ts
Location............: Library Of Legends/src/infrastructure/database/
Version.............: 1.0.0
Status..............: Core
Lifecycle...........: Production
Description.........: Typed PostgreSQL persistence for movies and episodes.
===============================================================================
*/

import { ParsedMedia } from "../../domain/media/media-types";
import { randomUUID } from "crypto";
import { Database } from "./database";

export interface LibraryItem {
  id: string;
  kind: "MOVIE" | "EPISODE";
  title: string;
  series_title?: string;
  season?: number;
  episode?: number;
  episode_title?: string;
  year?: number;
  file_name: string;
  file_id: string;
  file_size?: number;
  quality?: string;
  source?: string;
  audio?: string;
  video_codec?: string;
  genre: string;
  archive_id: string;
  telegram_chat_id?: string;
  telegram_message_id?: number;
  views: number;
  created_at: Date;
  updated_at: Date;
}

export class LibraryRepository {
  public constructor(private readonly database: Database) {}

  public async findByFileId(fileId: string): Promise<LibraryItem | null> {
    const result = await this.database.client.query<LibraryItem>(
      `SELECT * FROM library_items WHERE file_id = $1 LIMIT 1`,
      [fileId]
    );
    return result.rows[0] || null;
  }

  public async findById(id: string): Promise<LibraryItem | null> {
    const result = await this.database.client.query<LibraryItem>(
      `SELECT * FROM library_items WHERE id = $1 LIMIT 1`,
      [id]
    );
    return result.rows[0] || null;
  }

  public async search(query: string, limit = 20): Promise<LibraryItem[]> {
    const result = await this.database.client.query<LibraryItem>(
      `SELECT * FROM library_items
       WHERE LOWER(title) LIKE LOWER($1)
          OR LOWER(COALESCE(series_title, '')) LIKE LOWER($1)
          OR LOWER(file_name) LIKE LOWER($1)
       ORDER BY created_at DESC
       LIMIT $2`,
      [`%${query.trim()}%`, Math.min(Math.max(limit, 1), 100)]
    );
    return result.rows;
  }

  public async list(kind?: "MOVIE" | "EPISODE", limit = 50): Promise<LibraryItem[]> {
    if (kind) {
      const result = await this.database.client.query<LibraryItem>(
        `SELECT * FROM library_items WHERE kind = $1 ORDER BY created_at DESC LIMIT $2`,
        [kind, Math.min(Math.max(limit, 1), 100)]
      );
      return result.rows;
    }

    const result = await this.database.client.query<LibraryItem>(
      `SELECT * FROM library_items ORDER BY created_at DESC LIMIT $1`,
      [Math.min(Math.max(limit, 1), 100)]
    );
    return result.rows;
  }

  public async insert(input: ParsedMedia & { fileSize?: number; archiveId: string; telegramChatId?: string; telegramMessageId?: number; genre?: string }): Promise<LibraryItem> {
    const result = await this.database.client.query<LibraryItem>(
      `INSERT INTO library_items (
        id, kind, title, series_title, season, episode, episode_title, year,
        file_name, file_id, file_size, quality, source, audio, video_codec,
        genre, archive_id, telegram_chat_id, telegram_message_id
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19
      ) RETURNING *`,
      [
        randomUUID(),
        input.kind,
        input.title,
        input.kind === "EPISODE" ? input.title : null,
        input.season ?? null,
        input.episode ?? null,
        input.episodeTitle ?? null,
        input.year ?? null,
        input.fileName,
        (input as ParsedMedia & { fileId?: string }).fileId || "",
        input.fileSize ?? null,
        input.quality ?? null,
        input.source ?? null,
        input.audio ?? null,
        input.videoCodec ?? null,
        input.genre ?? "Unbekannt",
        input.archiveId,
        input.telegramChatId ?? null,
        input.telegramMessageId ?? null
      ]
    );
    return result.rows[0];
  }

  public async incrementViews(id: string): Promise<void> {
    await this.database.client.query(
      `UPDATE library_items SET views = views + 1, updated_at = NOW() WHERE id = $1`,
      [id]
    );
  }
}