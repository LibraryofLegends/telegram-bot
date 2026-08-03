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

Component...........: Rating

LOL-ID..............: LOL-MEDIA-0007

File................: rating.ts

Location............: src/media/domain/value-objects/

Dependencies........: None

Dependents..........:
- Movie
- Series
- Episode
- Metadata Capability
- Search Engine
- Recommendation Engine

Stability...........: Stable

License.............: MIT

===============================================================================

DESCRIPTION

Represents a normalized media rating.

Ratings from different providers (TMDB, IMDb, Rotten Tomatoes,
Metacritic, Trakt, Letterboxd, etc.) can be mapped into this common
domain object.

===============================================================================
*/

export enum RatingSource {

    TMDB = "tmdb",

    IMDB = "imdb",

    ROTTEN_TOMATOES = "rotten_tomatoes",

    METACRITIC = "metacritic",

    TRAKT = "trakt",

    LETTERBOXD = "letterboxd",

    USER = "user"

}

export class Rating {

    constructor(

        /**
         * Rating provider.
         */
        public readonly source: RatingSource,

        /**
         * Rating value.
         */
        public readonly value: number,

        /**
         * Maximum possible value.
         */
        public readonly maximum: number,

        /**
         * Number of votes.
         */
        public readonly votes: number = 0

    ) {

        if (value < 0) {

            throw new Error(

                "Rating cannot be negative."

            );

        }

        if (value > maximum) {

            throw new Error(

                "Rating exceeds maximum."

            );

        }

    }

    /**
     * Returns rating as percentage.
     */
    public percentage(): number {

        return (this.value / this.maximum) * 100;

    }

    /**
     * Compare ratings.
     */
    public equals(

        other: Rating

    ): boolean {

        return (

            this.source === other.source &&

            this.value === other.value &&

            this.maximum === other.maximum

        );

    }

}