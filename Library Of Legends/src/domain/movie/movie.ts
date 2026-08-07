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

Version.............: 3.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Represents the core movie entity.

===============================================================================
*/

import { Media } from "../../shared/domain/entities/media";

import { MovieId } from "./movie-id";

import { Runtime } from "../../shared/domain/value-objects/runtime";
import { Title } from "../../shared/domain/value-objects/title";
import { Year } from "../../shared/domain/value-objects/year";

/**
 * Represents a movie.
 *
 * This entity intentionally models only the movie itself.
 * Technical file information (codec, resolution, file size,
 * subtitles, audio tracks, etc.) belongs to a separate media file
 * model and not to the movie.
 */
export class Movie extends Media {

    public constructor(
        id: MovieId,
        title: Title,
        year: Year,
        public readonly runtime: Runtime
    ) {

        super(
            id,
            title,
            year
        );

    }

}