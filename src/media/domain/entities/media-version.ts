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

Component...........: Media Version

LOL-ID..............: LOL-MEDIA-0011

File................: media-version.ts

Location............: src/media/domain/entities/

Dependencies........:
- media-file.ts
- technical-metadata.ts

Dependents..........:
- Movie
- Series
- Episode
- Music
- Audiobook
- Comic
- Book

Stability...........: Stable

License.............: MIT

===============================================================================

DESCRIPTION

Represents one logical version (edition) of a media item.

Examples

• Blu-ray
• 4K UHD Remux
• WEB-DL
• Extended Edition
• Director's Cut
• DVD
• Digital Release

A version may contain multiple physical assets.

===============================================================================
*/

import { MediaFile } from "./media-file";

export enum MediaEdition {

    STANDARD = "Standard",

    EXTENDED = "Extended",

    DIRECTORS_CUT = "Director's Cut",

    COLLECTORS = "Collector's Edition",

    REMASTERED = "Remastered",

    IMAX = "IMAX",

    UHD = "UHD",

    BLURAY = "Blu-ray",

    DVD = "DVD",

    DIGITAL = "Digital"

}

export class MediaVersion {

    /**
     * Internal identifier.
     */
    public readonly id!: string;

    /**
     * Display name.
     */
    public name = "";

    /**
     * Edition.
     */
    public edition =
        MediaEdition.STANDARD;

    /**
     * Physical assets.
     */
    public assets: MediaFile[] = [];

    /**
     * Import source.
     */
    public source?: string;

    /**
     * Whether this version is preferred.
     */
    public preferred = false;

    /**
     * Whether archived.
     */
    public archived = false;

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

    /**
     * Adds a file to this version.
     */
    public addAsset(

        asset: MediaFile

    ): void {

        if (

            this.assets.some(

                existing =>

                    existing.id === asset.id

            )

        ) {

            return;

        }

        this.assets.push(asset);

        this.updatedAt = new Date();

    }

    /**
     * Removes a file.
     */
    public removeAsset(

        assetId: string

    ): void {

        this.assets =

            this.assets.filter(

                asset =>

                    asset.id !== assetId

            );

        this.updatedAt = new Date();

    }

}