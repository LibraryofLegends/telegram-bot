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

Component...........: Movie

LOL-ID..............: LOL-MEDIA-0002

File................: movie.ts

Location............: src/media/model/

Dependencies........:
- media-item.ts

Dependents..........:
- Metadata Capability
- TMDB Provider
- AI Provider
- Library Database
- Telegram Publisher
- Search Engine

Stability...........: Stable

License.............: MIT

===============================================================================

DESCRIPTION

Represents a single movie inside Project Phoenix.

Movies inherit all common media properties from MediaItem and extend
them with movie specific information.

===============================================================================
*/

import {

    MediaItem,
    MediaType

} from "./media-item";

export class Movie extends MediaItem {

    /**
     * Media type.
     */
    public readonly type =

        MediaType.MOVIE;

    /**
     * Runtime in minutes.
     */
    public runtime?: number;

    /**
     * Age rating.
     */
    public ageRating?: string;

    /**
     * Release date.
     */
    public releaseDate?: Date;

    /**
     * Story overview.
     */
    public overview?: string;

    /**
     * Tagline.
     */
    public tagline?: string;

    /**
     * IMDb identifier.
     */
    public imdbId?: string;

    /**
     * TMDB identifier.
     */
    public tmdbId?: number;

    /**
     * Collection identifier.
     */
    public collectionId?: string;

    /**
     * Director identifiers.
     */
    public directors: string[] = [];

    /**
     * Cast identifiers.
     */
    public cast: string[] = [];

    /**
     * Studio identifiers.
     */
    public studios: string[] = [];

    /**
     * Artwork identifiers.
     */
    public artworks: string[] = [];

    /**
     * Rating identifiers.
     */
    public ratings: string[] = [];

    /**
     * Technical metadata identifier.
     */
    public metadataId?: string;

}