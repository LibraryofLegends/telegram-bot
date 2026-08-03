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

Component...........: Movie Version

LOL-ID..............: LOL-MEDIA-0009

File................: movie-version.ts

Location............: src/media/domain/entities/

Dependencies........:
- technical-metadata.ts

Dependents..........:
- Movie
- Import Pipeline
- Library Database
- Telegram Publisher
- Search Engine

Stability...........: Stable

License.............: MIT

===============================================================================

DESCRIPTION

Represents one specific edition/version of a movie.

A movie can have multiple versions such as:

• 4K Remux
• BluRay
• WEB-DL
• Director's Cut
• Extended Edition
• IMAX Edition

Each version owns its own technical metadata and storage information.

===============================================================================
*/

import { TechnicalMetadata }
    from "../value-objects/technical-metadata";

export class MovieVersion {

    /**
     * Internal version identifier.
     */
    public readonly id!: string;

    /**
     * Version display name.
     */
    public name = "";

    /**
     * Edition label.
     */
    public edition?: string;

    /**
     * Technical metadata.
     */
    public technicalMetadata =
        new TechnicalMetadata();

    /**
     * Physical storage paths.
     */
    public files: string[] = [];

    /**
     * Import source.
     */
    public source?: string;

    /**
     * Import timestamp.
     */
    public importedAt = new Date();

    /**
     * Last verification.
     */
    public verifiedAt?: Date;

    /**
     * Indicates whether this version is the preferred version.
     */
    public preferred = false;

    /**
     * Marks this version as archived.
     */
    public archived = false;

}