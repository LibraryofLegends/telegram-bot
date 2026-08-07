/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: SeasonId

Architecture Layer..: Domain

Module..............: Media

Module ID...........: LOL-MOD-SEA-0001

LOL-ID..............: LOL-SEA-0002

File................: season-id.ts

Location............
Library Of Legends/src/domain/media/season/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Represents the unique identifier for a season entity.

===============================================================================
*/

import { EntityId } from "../../../shared/domain/identifiers/entity-id";

/**
 * Represents the unique identifier of a season.
 */
export class SeasonId extends EntityId {

    /**
     * Creates a new season identifier.
     *
     * @param value Identifier value.
     */
    public constructor(value: string) {

        super(value);

    }

}