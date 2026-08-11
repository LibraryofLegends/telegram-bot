/*
===============================================================================
                            PROJECT PHOENIX
===============================================================================
Component...........: MoviePostBuilder
Architecture Layer..: Application
Module..............: Telegram
Module ID...........: LOL-MOD-TG-POST-0001
LOL-ID..............: LOL-TG-POST-MOV-0001
File................: movie-post-builder.ts
Location............: Library Of Legends/src/application/telegram/
Version.............: 1.0.0
Status..............: Core
Lifecycle...........: Production
Description.........: Single canonical movie Telegram post renderer.
===============================================================================
*/

import { TMDBMetadata } from "../../infrastructure/tmdb/tmdb-client";
import { LibraryItem } from "../../infrastructure/database/library-repository";

export interface TelegramPost {
  caption: string;
  posterUrl?: string;
  buttons: Array<Array<{ text: string; callbackData?: string; url?: string }>>;
}

export class MoviePostBuilder {
  public static build(item: LibraryItem, tmdb?: TMDBMetadata): TelegramPost {
    const title = tmdb?.title || item.title;
    const year = tmdb?.year || item.year;
    const rating = tmdb?.rating !== undefined ? `⭐ Bewertung: ${tmdb.rating.toFixed(1)}/10` : "";
    const cast = tmdb?.cast?.slice(0, 3).map((person) => `#${person.name.replace(/\s+/g, "")}`).join(" • ");
    const overview = tmdb?.overview ? this.limit(tmdb.overview, 900) : "Keine Beschreibung verfügbar.";
    const technical = [item.quality, this.formatSize(item.file_size), item.audio].filter(Boolean).join(" · ");
    const category = item.genre || "Unbekannt";

    const lines = [
      `🎬 <b>${this.escape(title)}${year ? ` (${year})` : ""}</b>`,
      "━━━━━━━━━━━━━━━━━━",
      [rating, cast ? `👥 ${this.escape(cast)}` : ""].filter(Boolean).join("\n"),
      "━━━━━━━━━━━━━━━━━━",
      "📝 <b>Handlung:</b>",
      this.escape(overview),
      "━━━━━━━━━━━━━━━━━━",
      technical ? `📦 ${this.escape(technical)}` : "",
      "━━━━━━━━━━━━━━━━━━",
      `📁 Archiv: <code>${this.escape(item.archive_id)}</code> #${this.hashtag(category)}`,
      "🎬 <b>Library Of Legends</b>"
    ].filter(Boolean);

    return {
      caption: lines.join("\n"),
      posterUrl: tmdb?.posterUrl,
      buttons: []
    };
  }

  private static escape(value: string): string { return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  private static hashtag(value: string): string { return value.replace(/[^\p{L}\p{N}]+/gu, "").toLowerCase() || "allgemein"; }
  private static limit(value: string, max: number): string { return value.length <= max ? value : `${value.slice(0, max - 1).trim()}…`; }
  private static formatSize(bytes?: number): string { if (!bytes || bytes <= 0) return ""; const units=["B","KB","MB","GB","TB"]; let value=bytes; let i=0; while(value>=1024&&i<units.length-1){value/=1024;i++;} return `${value.toFixed(i===0?0:2)} ${units[i]}`; }
}
