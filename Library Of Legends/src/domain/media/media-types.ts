/*
===============================================================================
                            PROJECT PHOENIX
===============================================================================
Component...........: MediaTypes
Architecture Layer..: Domain
Module..............: Media
Module ID...........: LOL-MOD-DOM-MEDIA-0001
LOL-ID..............: LOL-DOM-MEDIA-0001
File................: media-types.ts
Location............: Library Of Legends/src/domain/media/
Version.............: 1.0.0
Status..............: Core
Lifecycle...........: Production
Description.........: Canonical media types used by the first stable bot.
===============================================================================
*/

export type MediaKind = "MOVIE" | "EPISODE";

export interface ParsedMedia {
  kind: MediaKind;
  title: string;
  season?: number;
  episode?: number;
  episodeTitle?: string;
  year?: number;
  quality?: string;
  source?: string;
  audio?: string;
  videoCodec?: string;
  fileName: string;
}