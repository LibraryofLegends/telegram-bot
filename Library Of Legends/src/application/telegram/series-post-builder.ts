/*
===============================================================================
                            PROJECT PHOENIX
===============================================================================
Component...........: SeriesPostBuilder
Architecture Layer..: Application
Module..............: Telegram
Module ID...........: LOL-MOD-TG-POST-0002
LOL-ID..............: LOL-TG-POST-SER-0001
File................: series-post-builder.ts
Location............: Library Of Legends/src/application/telegram/
Version.............: 1.0.0
Status..............: Core
Lifecycle...........: Production
Description.........: Single canonical episode Telegram post renderer.
===============================================================================
*/

import { TMDBMetadata } from "../../infrastructure/tmdb/tmdb-client";
import { LibraryItem } from "../../infrastructure/database/library-repository";

export interface TelegramPost {
  caption: string;
  posterUrl?: string;
  buttons: Array<Array<{ text: string; callbackData?: string; url?: string }>>;
}

export class SeriesPostBuilder {
  public static build(item: LibraryItem, tmdb?: TMDBMetadata): TelegramPost {
    const title = tmdb?.title || item.series_title || item.title;
    const code = item.season !== undefined && item.episode !== undefined ? `S${String(item.season).padStart(2,"0")}E${String(item.episode).padStart(2,"0")}` : "";
    const rating = tmdb?.rating !== undefined ? `⭐ ${tmdb.rating.toFixed(1)}/10` : "⭐ —";
    const genres = item.genre || "Unbekannt";
    const overview = tmdb?.overview ? this.limit(tmdb.overview, 900) : "Keine Beschreibung verfügbar.";
    const technical = [item.quality, this.formatSize(item.file_size), item.audio].filter(Boolean).join(" · ");

    const lines = [
      `📺 <b>${this.escape(title)}${item.year ? ` (${item.year})` : ""}</b>`,
      "━━━━━━━━━━━━━━━━━━",
      code ? `🎬 <b>${code}</b>` : "",
      item.episode_title ? this.escape(item.episode_title) : "",
      "━━━━━━━━━━━━━━━━━━",
      rating,
      `🏷️ ${this.escape(genres)}`,
      "━━━━━━━━━━━━━━━━━━",
      technical ? `📦 ${this.escape(technical)}` : "",
      "━━━━━━━━━━━━━━━━━━",
      "📝 <b>Story:</b>",
      this.escape(overview),
      "━━━━━━━━━━━━━━━━━━",
      `📁 Archiv: <code>${this.escape(item.archive_id)}</code>`,
      "📺 <b>Library Of Legends</b>"
    ].filter(Boolean);

    return { caption: lines.join("\n"), posterUrl: tmdb?.posterUrl, buttons: [] };
  }

  private static escape(value: string): string { return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  private static limit(value: string, max: number): string { return value.length <= max ? value : `${value.slice(0,max-1).trim()}…`; }
  private static formatSize(bytes?: number): string { if (!bytes || bytes <= 0) return ""; const units=["B","KB","MB","GB","TB"]; let value=bytes; let i=0; while(value>=1024&&i<units.length-1){value/=1024;i++;} return `${value.toFixed(i===0?0:2)} ${units[i]}`; }
}