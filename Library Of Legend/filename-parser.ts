/*
===============================================================================
                            PROJECT PHOENIX
===============================================================================
Component...........: FilenameParser
Architecture Layer..: Domain
Module..............: Media
Module ID...........: LOL-MOD-DOM-PARSER-0001
LOL-ID..............: LOL-DOM-PARSER-0001
File................: filename-parser.ts
Location............: Library Of Legends/src/domain/media/
Version.............: 1.0.0
Status..............: Core
Lifecycle...........: Production
Description.........: Single deterministic parser for movie and episode names.
===============================================================================
*/

import { ParsedMedia } from "./media-types";

const MEDIA_EXTENSIONS = /\.(mp4|mkv|avi|mov|m4v|webm|ts|m2ts)$/i;
const SERIES_PATTERN = /\bS(\d{1,3})E(\d{1,4})\b/i;
const YEAR_PATTERN = /\b((?:19|20)\d{2})\b/;

export class FilenameParser {
  public static parse(fileName: string): ParsedMedia {
    const original = String(fileName || "").trim();
    const withoutExtension = original.replace(MEDIA_EXTENSIONS, "");
    const normalized = withoutExtension
      .replace(/[._]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const seriesMatch = normalized.match(SERIES_PATTERN);

    if (seriesMatch) {
      const season = Number(seriesMatch[1]);
      const episode = Number(seriesMatch[2]);
      const before = normalized.slice(0, seriesMatch.index).trim();
      const after = normalized.slice((seriesMatch.index || 0) + seriesMatch[0].length).trim();
      const year = this.extractYear(before);
      const title = this.cleanMovieOrSeriesTitle(before, year);
      const episodeTitle = this.cleanEpisodeTitle(after);

      return {
        kind: "EPISODE",
        title: title || "Unbekannte Serie",
        season,
        episode,
        episodeTitle,
        year,
        quality: this.extract(normalized, /\b(2160p|4K|1080p|FHD|720p|HD|480p)\b/i),
        source: this.extract(normalized, /\b(WEB-DL|WEBRip|WEB|BluRay|HDTV)\b/i),
        audio: this.extract(normalized, /\b(DDP?5\.1|DD5\.1|DTS|AC3|AAC|EAC3|Deutsch|German|Dual)\b/i),
        videoCodec: this.extract(normalized, /\b(x264|x265|H\.?264|H\.?265|AV1)\b/i),
        fileName: original
      };
    }

    const year = this.extractYear(normalized);

    return {
      kind: "MOVIE",
      title: this.cleanMovieOrSeriesTitle(normalized, year) || "Unbekannter Film",
      year,
      quality: this.extract(normalized, /\b(2160p|4K|1080p|FHD|720p|HD|480p)\b/i),
      source: this.extract(normalized, /\b(WEB-DL|WEBRip|WEB|BluRay|HDTV)\b/i),
      audio: this.extract(normalized, /\b(DDP?5\.1|DD5\.1|DTS|AC3|AAC|EAC3|Deutsch|German|Dual)\b/i),
      videoCodec: this.extract(normalized, /\b(x264|x265|H\.?264|H\.?265|AV1)\b/i),
      fileName: original
    };
  }

  private static extractYear(value: string): number | undefined {
    const match = value.match(YEAR_PATTERN);
    return match ? Number(match[1]) : undefined;
  }

  private static cleanMovieOrSeriesTitle(value: string, year?: number): string {
    let title = value;
    if (year) title = title.replace(String(year), "");
    title = title
      .replace(/\b(2160p|4K|1080p|FHD|720p|HD|480p)\b/gi, "")
      .replace(/\b(WEB-DL|WEBRip|WEB|BluRay|HDTV)\b/gi, "")
      .replace(/\b(x264|x265|H\.?264|H\.?265|AV1)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();
    return title;
  }

  private static cleanEpisodeTitle(value: string): string | undefined {
    const cleaned = value
      .replace(/\b(2160p|4K|1080p|FHD|720p|HD|480p)\b/gi, "")
      .replace(/\b(WEB-DL|WEBRip|WEB|BluRay|HDTV)\b/gi, "")
      .replace(/\b(x264|x265|H\.?264|H\.?265|AV1)\b/gi, "")
      .replace(/\s+/g, " ")
      .replace(/^[\s._-]+|[\s._-]+$/g, "")
      .trim();
    return cleaned || undefined;
  }

  private static extract(value: string, pattern: RegExp): string | undefined {
    const match = value.match(pattern);
    return match?.[1] || undefined;
  }
}
