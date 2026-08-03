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

Component...........: Media File

LOL-ID..............: LOL-MEDIA-0010

File................: media-file.ts

Location............: src/media/domain/entities/

Dependencies........:
- technical-metadata.ts

Dependents..........:
- MovieVersion
- Import Pipeline
- Media Scanner
- FFprobe Provider
- Library Database

Stability...........: Stable

License.............: MIT

===============================================================================

DESCRIPTION

Represents one physical file belonging to a media version.

Examples

• Movie MKV
• MP4
• Blu-ray M2TS
• Subtitle
• Cover
• Poster
• NFO
• ISO
• ZIP

===============================================================================
*/

import { TechnicalMetadata }
    from "../value-objects/technical-metadata";

export enum MediaFileType {

    VIDEO = "video",

    AUDIO = "audio",

    SUBTITLE = "subtitle",

    IMAGE = "image",

    METADATA = "metadata",

    ARCHIVE = "archive",

    DISC = "disc",

    OTHER = "other"

}

export class MediaFile {

    /**
     * Internal identifier.
     */
    public readonly id!: string;

    /**
     * File type.
     */
    public readonly type: MediaFileType;

    /**
     * Absolute file path.
     */
    public path: string;

    /**
     * File name.
     */
    public fileName: string;

    /**
     * File extension.
     */
    public extension: string;

    /**
     * File size.
     */
    public fileSize: number;

    /**
     * SHA-256 checksum.
     */
    public sha256?: string;

    /**
     * MD5 checksum.
     */
    public md5?: string;

    /**
     * Last modification.
     */
    public lastModified?: Date;

    /**
     * Technical metadata.
     */
    public technicalMetadata?: TechnicalMetadata;

    /**
     * Import timestamp.
     */
    public readonly importedAt =
        new Date();

    constructor(

        type: MediaFileType,

        path: string,

        fileName: string,

        extension: string,

        fileSize: number

    ) {

        this.type = type;

        this.path = path;

        this.fileName = fileName;

        this.extension = extension;

        this.fileSize = fileSize;

    }

}