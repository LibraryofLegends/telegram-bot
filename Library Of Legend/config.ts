/*
===============================================================================
                            PROJECT PHOENIX
===============================================================================
Component...........: AppConfig
Architecture Layer..: Infrastructure
Module..............: Configuration
Module ID...........: LOL-MOD-CONFIG-0001
LOL-ID..............: LOL-CONFIG-0001
File................: config.ts
Location............: Library Of Legends/src/config/
Version.............: 1.0.0
Status..............: Core
Lifecycle...........: Production
Description.........: Single source of truth for runtime environment values.
===============================================================================
*/

export interface AppConfig {
  telegramBotToken: string;
  databaseUrl: string;
  tmdbApiKey?: string;
  movieGroupId?: string;
  seriesGroupId?: string;
  port: number;
}

function required(name: string, value: string | undefined): string {
  const clean = String(value ?? "").trim();
  if (!clean) {
    throw new Error(`Konfigurationsvariable fehlt: ${name}`);
  }
  return clean;
}

export function loadConfig(): AppConfig {
  const telegramBotToken = required(
    "TELEGRAM_BOT_TOKEN",
    process.env.TELEGRAM_BOT_TOKEN || process.env.TOKEN
  );

  const databaseUrl = required(
    "DATABASE_URL",
    process.env.DATABASE_URL
  );

  const tmdbApiKey = String(
    process.env.TMDB_API_KEY || process.env.TMDB_KEY || ""
  ).trim() || undefined;

  const portValue = Number(process.env.PORT || 3000);

  return {
    telegramBotToken,
    databaseUrl,
    tmdbApiKey,
    movieGroupId: String(process.env.MOVIE_GROUP_ID || "").trim() || undefined,
    seriesGroupId: String(process.env.SERIES_GROUP_ID || "").trim() || undefined,
    port: Number.isFinite(portValue) ? portValue : 3000
  };
}
