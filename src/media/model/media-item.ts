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

Package.............: Model

Component...........: Media Item

LOL-ID..............: LOL-MEDIA-0001

File................: media-item.ts

Location............: src/media/model/

Dependencies........: None

Dependents..........:
- Metadata Capability
- Import Pipeline
- Search Engine
- Database
- Telegram
- AI Provider

Stability...........: Stable

License.............: MIT

===============================================================================

DESCRIPTION

Base domain model representing a media item.

Every supported media type derives from this model.

===============================================================================
*/

export enum MediaType {

    MOVIE = "movie",

    SERIES = "series",

    EPISODE = "episode",

    MUSIC = "music",

    AUDIOBOOK = "audiobook",

    AUDIOPLAY = "audioplay",

    BOOK = "book",

    COMIC = "comic",

    MAGAZINE = "magazine",

    DOCUMENTARY = "documentary"

}

export abstract class MediaItem {

    /**
     * Internal Library ID.
     */
    public readonly libraryId!: string;

    /**
     * Media type.
     */
    public abstract readonly type: MediaType;

    /**
     * Local title.
     */
    public title = "";

    /**
     * Original title.
     */
    public originalTitle?: string;

    /**
     * Release year.
     */
    public year?: number;

    /**
     * Country of origin.
     */
    public countries: string[] = [];

    /**
     * Spoken languages.
     */
    public languages: string[] = [];

    /**
     * Genres.
     */
    public genres: string[] = [];

    /**
     * Tags.
     */
    public tags: string[] = [];

    /**
     * Creation timestamp.
     */
    public readonly createdAt = new Date();

    /**
     * Last update timestamp.
     */
    public updatedAt = new Date();

}