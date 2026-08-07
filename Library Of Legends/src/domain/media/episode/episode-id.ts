/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: EpisodeId

Architecture Layer..: Domain

Module..............: Media

Module ID...........: LOL-MOD-EPI-0001

LOL-ID..............: LOL-EPI-0002

File................: episode-id.ts

Location............
Library Of Legends/src/domain/media/episode/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Represents the unique identifier for an episode entity.

===============================================================================
*/

import { EntityId } from "../../../shared/domain/identifiers/entity-id";

/**
 * Represents the unique identifier of an episode.
 */
export class EpisodeId extends EntityId {

    /**
     * Creates a new episode identifier.
     *
     * @param value Identifier value.
     */
    public constructor(value: string) {

        super(value);

    }

}