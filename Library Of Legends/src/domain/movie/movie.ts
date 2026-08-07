/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: Movie

Architecture Layer..: Domain

Module..............: Movie

Module ID...........: LOL-MOD-MOV-0001

LOL-ID..............: LOL-MOV-0001

File................: movie.ts

Location............
Library Of Legends/src/domain/movie/

Version.............: 4.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Represents the aggregate root for a movie.

===============================================================================
*/

import { Media } from "../../shared/domain/entities/media";
import { MovieId } from "./movie-id";

import { Runtime } from "../../shared/domain/value-objects/runtime";
import { Title } from "../../shared/domain/value-objects/title";
import { Year } from "../../shared/domain/value-objects/year";

export class Movie extends Media {

    public constructor(
        id: MovieId,
        title: Title,
        year: Year,
        public readonly runtime: Runtime
    ) {

        super(id, title, year);

    }

    /**
     * Determines whether the movie is a classic.
     */
    public isClassic(referenceYear: number = new Date().getFullYear()): boolean {

        return referenceYear - this.year.valueOf() >= 25;

    }

}