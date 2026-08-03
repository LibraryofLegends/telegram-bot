/*
===============================================================================
██╗      ██████╗  █████╗ ███████╗
██║     ██╔═══██╗██╔══██╗██╔════╝
██║     ██║   ██║███████║█████╗
██║     ██║   ██║██╔══██║██╔══╝
███████╗╚██████╔╝██║  ██║██║
╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚═╝

          Library Of Legends Application Framework

===============================================================================

Architecture Layer..: Domain

Subsystem...........: Media

Module..............: Media Engine

Package.............: Value Objects

Component...........: Technical Metadata

LOL-ID..............: LOL-MEDIA-0008

File................: technical-metadata.ts

Location............: src/media/domain/value-objects/

Dependencies........: None

Dependents..........:
- Movie
- Episode
- Import Pipeline
- Media Scanner
- FFprobe Provider
- Telegram Publisher

Stability...........: Stable

License.............: MIT

===============================================================================

DESCRIPTION

Contains all technical information about a specific media file.

This object intentionally contains NO content metadata.

===============================================================================
*/

export class TechnicalMetadata {

    /**
     * Container format.
     * Example: MKV, MP4
     */
    public container?: string;

    /**
     * Video resolution.
     */
    public resolution?: string;

    /**
     * Video codec.
     */
    public videoCodec?: string;

    /**
     * Audio codec.
     */
    public audioCodec?: string;

    /**
     * Audio channel layout.
     */
    public audioChannels?: string;

    /**
     * Dynamic range.
     * SDR, HDR10, HDR10+, Dolby Vision...
     */
    public hdrFormat?: string;

    /**
     * Frame rate.
     */
    public frameRate?: number;

    /**
     * Bitrate.
     */
    public bitrate?: number;

    /**
     * File size in bytes.
     */
    public fileSize?: number;

    /**
     * Runtime in seconds.
     */
    public duration?: number;

    /**
     * Source.
     * BluRay, WEB-DL, WEBRip...
     */
    public source?: string;

    /**
     * Release group.
     */
    public releaseGroup?: string;

    /**
     * Video language.
     */
    public videoLanguage?: string;

    /**
     * Available audio languages.
     */
    public audioLanguages: string[] = [];

    /**
     * Subtitle languages.
     */
    public subtitleLanguages: string[] = [];

    /**
     * Creation timestamp.
     */
    public readonly createdAt = new Date();

    /**
     * Last update.
     */
    public updatedAt = new Date();

}