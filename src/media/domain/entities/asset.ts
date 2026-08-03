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

Package.............: Entities

Component...........: Asset

LOL-ID..............: LOL-MEDIA-0012

File................: asset.ts

Location............: src/media/domain/entities/

Dependencies........:
- technical-metadata.ts

Dependents..........:
- MediaVersion
- Import Pipeline
- Scanner
- Storage
- Telegram
- Search

Stability...........: Stable

License.............: MIT

===============================================================================

DESCRIPTION

Represents any physical or virtual resource belonging to a media version.

Examples

• MKV
• MP4
• Blu-ray
• ISO
• Subtitle
• Poster
• FanArt
• Trailer
• NFO
• Remote Stream

===============================================================================
*/

import { TechnicalMetadata }
    from "../value-objects/technical-metadata";

export enum AssetType {

    VIDEO = "video",

    AUDIO = "audio",

    SUBTITLE = "subtitle",

    ARTWORK = "artwork",

    METADATA = "metadata",

    DISC = "disc",

    ARCHIVE = "archive",

    STREAM = "stream",

    OTHER = "other"

}

export enum AssetState {

    AVAILABLE = "available",

    MISSING = "missing",

    OFFLINE = "offline",

    DAMAGED = "damaged",

    IMPORTING = "importing"

}

export class Asset {

    /**
     * Internal identifier.
     */
    public readonly id!: string;

    /**
     * Asset type.
     */
    public type: AssetType = AssetType.OTHER;

    /**
     * Current state.
     */
    public state: AssetState =
        AssetState.AVAILABLE;

    /**
     * Display name.
     */
    public name = "";

    /**
     * Original file name.
     */
    public fileName?: string;

    /**
     * Relative storage path.
     */
    public path?: string;

    /**
     * MIME type.
     */
    public mimeType?: string;

    /**
     * File size.
     */
    public size?: number;

    /**
     * SHA-256 checksum.
     */
    public checksum?: string;

    /**
     * Technical information.
     */
    public technicalMetadata?:
        TechnicalMetadata;

    /**
     * Creation timestamp.
     */
    public readonly createdAt =
        new Date();

    /**
     * Last update.
     */
    public updatedAt =
        new Date();

}