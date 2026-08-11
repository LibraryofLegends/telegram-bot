/*
===============================================================================
                            PROJECT PHOENIX
===============================================================================
Component...........: TelegramBot
Architecture Layer..: Framework
Module..............: Telegram
Module ID...........: LOL-MOD-TG-0001
LOL-ID..............: LOL-TG-BOT-0001
File................: telegram-bot.ts
Location............: Library Of Legends/src/framework/telegram/
Version.............: 1.0.0
Status..............: Core
Lifecycle...........: Production
Description.........: Single Telegram entry point for the clean restart.
===============================================================================
*/

import { Context, Markup, Telegraf } from "telegraf";
import { AppConfig } from "../../config/config";
import { FilenameParser } from "../../domain/media/filename-parser";
import { Database } from "../../infrastructure/database/database";
import { LibraryRepository } from "../../infrastructure/database/library-repository";
import { TopicRepository } from "../../infrastructure/database/topic-repository";
import { TMDBClient } from "../../infrastructure/tmdb/tmdb-client";
import { MoviePostBuilder } from "../../application/telegram/movie-post-builder";
import { SeriesPostBuilder } from "../../application/telegram/series-post-builder";

interface MediaMessage {
  fileId: string;
  fileName: string;
  fileSize?: number;
}

export class TelegramBot {
  private readonly bot: Telegraf<Context>;
  private readonly database: Database;
  private readonly library: LibraryRepository;
  private readonly topics: TopicRepository;
  private readonly tmdb: TMDBClient;
  private started = false;

  public constructor(private readonly config: AppConfig) {
    this.bot = new Telegraf<Context>(config.telegramBotToken);
    this.database = new Database(config.databaseUrl);
    this.library = new LibraryRepository(this.database);
    this.topics = new TopicRepository(this.database);
    this.tmdb = new TMDBClient(config.tmdbApiKey);
    this.registerHandlers();
  }

  public async initialize(): Promise<void> {
    await this.database.initialize();
  }

  public async launch(): Promise<void> {
    if (this.started) return;
    await this.initialize();
    this.started = true;
    await this.bot.launch({ dropPendingUpdates: false });
  }

  public async stop(reason = "shutdown"): Promise<void> {
    if (!this.started) return;
    this.bot.stop(reason);
    this.started = false;
    await this.database.close();
  }

  public getHttpStatus(): string {
    return "Library Of Legends Bot läuft";
  }

  private registerHandlers(): void {
    this.bot.start((ctx) => this.replyStart(ctx));
    this.bot.help((ctx) => ctx.reply("/start\n/help\n/find TITEL\n/movies\n/series"));
    this.bot.command("find", (ctx) => this.handleSearch(ctx));
    this.bot.command("movies", (ctx) => this.handleList(ctx, "MOVIE"));
    this.bot.command("series", (ctx) => this.handleList(ctx, "EPISODE"));

    this.bot.on("video", (ctx) => this.handleMedia(ctx));
    this.bot.on("document", (ctx) => this.handleMedia(ctx));

    this.bot.catch((error) => {
      console.error("Telegram Handler Fehler:", error);
    });
  }

  private async replyStart(ctx: Context): Promise<void> {
    await ctx.reply(
      [
        "🎬 <b>Library Of Legends</b>",
        "",
        "━━━━━━━━━━━━━━━━━━",
        "",
        "🎞️ Willkommen im Medienarchiv!",
        "",
        "🔎 Filme und Serien durchsuchen",
        "📚 Archiv durchsuchen",
        "",
        "💡 <code>/find Superman</code>"
      ].join("\n"),
      { parse_mode: "HTML", ...Markup.keyboard([["🎬 Filme", "📺 Serien"]], { columns: 2 }).resize() }
    );
  }

  private async handleSearch(ctx: Context): Promise<void> {
    const text = "text" in (ctx.message || {}) ? String((ctx.message as any).text || "") : "";
    const query = text.replace(/^\/find(?:@\w+)?/i, "").trim();
    if (!query) { await ctx.reply("Verwendung: /find TITEL"); return; }
    const items = await this.library.search(query);
    if (!items.length) { await ctx.reply(`🔎 Keine Treffer für ${query}`); return; }
    const buttons = items.slice(0, 20).map((item) => [Markup.button.callback(`${item.kind === "MOVIE" ? "🎬" : "📺"} ${item.title}`, `open_${item.id}`)]);
    await ctx.reply(`🔎 <b>Treffer für ${this.escape(query)}</b>`, { parse_mode: "HTML", ...Markup.inlineKeyboard(buttons) });
    for (const item of items.slice(0, 1)) await this.replyItem(ctx, item);
  }

  private async handleList(ctx: Context, kind: "MOVIE" | "EPISODE"): Promise<void> {
    const items = await this.library.list(kind, 20);
    if (!items.length) { await ctx.reply(kind === "MOVIE" ? "🎬 Noch keine Filme." : "📺 Noch keine Episoden."); return; }
    const buttons = items.map((item) => [Markup.button.callback(`${kind === "MOVIE" ? "🎬" : "📺"} ${item.title}`, `open_${item.id}`)]);
    await ctx.reply(kind === "MOVIE" ? "🎬 <b>Filme</b>" : "📺 <b>Serien</b>", { parse_mode: "HTML", ...Markup.inlineKeyboard(buttons) });
  }

  private async handleMedia(ctx: Context): Promise<void> {
    const media = this.extractMedia(ctx);
    if (!media) return;

    const parsed = FilenameParser.parse(media.fileName);
    const existing = await this.library.findByFileId(media.fileId);
    if (existing) { await ctx.reply(`⚠️ Bereits archiviert: ${this.escape(existing.title)}`, { parse_mode: "HTML" }); return; }

    const tmdb = parsed.kind === "MOVIE"
      ? await this.tmdb.findMovie(parsed.title, parsed.year)
      : await this.tmdb.findSeries(parsed.title, parsed.year);

    const archiveId = parsed.kind === "MOVIE"
      ? `LIB-MOV-${Date.now()}`
      : `LIB-SER-S${String(parsed.season || 0).padStart(2,"0")}E${String(parsed.episode || 0).padStart(2,"0")}-${Date.now()}`;

    const item = await this.library.insert({
      ...parsed,
      fileId: media.fileId,
      fileSize: media.fileSize,
      archiveId
    } as any);

    await this.replyItem(ctx, item, tmdb);
    await ctx.reply(`✅ <b>${parsed.kind === "MOVIE" ? "Film" : "Episode"} archiviert</b>\n\n${this.escape(parsed.title)}`, { parse_mode: "HTML" });
  }

  private async replyItem(ctx: Context, item: any, tmdb?: any): Promise<void> {
    const post = item.kind === "MOVIE" ? MoviePostBuilder.build(item, tmdb) : SeriesPostBuilder.build(item, tmdb);
    if (post.posterUrl) {
      await ctx.replyWithPhoto(post.posterUrl, { caption: post.caption, parse_mode: "HTML" });
    } else {
      await ctx.reply(post.caption, { parse_mode: "HTML" });
    }
    await ctx.replyWithDocument(item.file_id, { caption: item.title });
  }

  private extractMedia(ctx: Context): MediaMessage | undefined {
    const message: any = ctx.message;
    if (!message) return undefined;
    if (message.video?.file_id) return { fileId: message.video.file_id, fileName: message.video.file_name || `video_${message.video.file_unique_id}.mp4`, fileSize: message.video.file_size };
    if (message.document?.file_id) {
      const fileName = message.document.file_name || `document_${message.document.file_unique_id}`;
      if (!/\.(mp4|mkv|avi|mov|m4v|webm|ts|m2ts)$/i.test(fileName)) return undefined;
      return { fileId: message.document.file_id, fileName, fileSize: message.document.file_size };
    }
    return undefined;
  }

  private escape(value: string): string { return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
}