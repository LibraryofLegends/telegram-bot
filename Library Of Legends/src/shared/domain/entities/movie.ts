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

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Represents a movie entity.

===============================================================================
*/

import { Media } from "./media";

import { MediaId } from "../identifiers/media-id";

import { Runtime } from "../value-objects/runtime";
import { Title } from "../value-objects/title";
import { Year } from "../value-objects/year";

/**
 * Represents a movie.
 */
export class Movie extends Media {

    public constructor(
        id: MediaId,
        title: Title,
        year: Year,
        runtime: Runtime
    ) {

        super(
            id,
            title,
            year,
            runtime
        );

    }

}