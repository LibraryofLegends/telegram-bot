/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: Movie

Architecture Layer..: Shared Domain

Module..............: Entities

Module ID...........: LOL-MOD-DOM-0002

LOL-ID..............: LOL-ENT-0003

File................: movie.ts

Location............
Library Of Legends/src/shared/domain/entities/

Version.............: 2.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Represents a movie entity.

===============================================================================
*/

import { Media } from "./media";

import { MovieId } from "../identifiers/movie-id";

import { Language } from "../value-objects/language";
import { Rating } from "../value-objects/rating";
import { Resolution } from "../value-objects/resolution";
import { Runtime } from "../value-objects/runtime";
import { Title } from "../value-objects/title";
import { Year } from "../value-objects/year";

/**
 * Represents a movie.
 */
export class Movie extends Media {

    public constructor(
        id: MovieId,
        title: Title,
        year: Year,
        public readonly runtime: Runtime,
        public readonly language?: Language,
        public readonly rating?: Rating,
        public readonly resolution?: Resolution
    ) {

        super(
            id,
            title,
            year
        );

    }

}