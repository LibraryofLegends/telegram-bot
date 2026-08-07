/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: MovieId

Architecture Layer..: Shared Domain

Module..............: Identifiers

Module ID...........: LOL-MOD-DOM-0003

LOL-ID..............: LOL-ID-0003

File................: movie-id.ts

Location............
Library Of Legends/src/shared/domain/identifiers/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Represents the identifier for a movie entity.

===============================================================================
*/

import { MediaId } from "./media-id";

/**
 * Represents the unique identifier of a movie.
 */
export class MovieId extends MediaId {

    /**
     * Creates a new movie identifier.
     *
     * @param value Identifier value.
     */
    public constructor(value: string) {

        super(value);

    }

}