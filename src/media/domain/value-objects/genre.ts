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

Component...........: Genre

LOL-ID..............: LOL-MEDIA-0004

File................: genre.ts

Location............: src/media/domain/value-objects/

Dependencies........: None

Dependents..........:
- Movie
- Series
- Book
- Comic
- Music
- Search Engine
- Metadata Capability

Stability...........: Stable

License.............: MIT

===============================================================================

DESCRIPTION

Represents a media genre.

Genres are immutable value objects shared across all supported media
types.

===============================================================================
*/

export enum GenreType {

    ACTION = "Action",

    ADVENTURE = "Adventure",

    ANIMATION = "Animation",

    ANIME = "Anime",

    BIOGRAPHY = "Biography",

    COMEDY = "Comedy",

    CRIME = "Crime",

    DOCUMENTARY = "Documentary",

    DRAMA = "Drama",

    FAMILY = "Family",

    FANTASY = "Fantasy",

    HISTORY = "History",

    HORROR = "Horror",

    MUSIC = "Music",

    MYSTERY = "Mystery",

    ROMANCE = "Romance",

    SCIENCE_FICTION = "Science Fiction",

    SPORT = "Sport",

    THRILLER = "Thriller",

    WAR = "War",

    WESTERN = "Western"

}

export class Genre {

    constructor(

        public readonly id: string,

        public readonly name: GenreType

    ) {}

    /**
     * Returns whether two genres are equal.
     */
    public equals(

        other: Genre

    ): boolean {

        return this.id === other.id;

    }

    /**
     * Human readable representation.
     */
    public toString(): string {

        return this.name;

    }

}