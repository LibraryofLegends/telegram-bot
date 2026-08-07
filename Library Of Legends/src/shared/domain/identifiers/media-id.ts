/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: MediaId

Architecture Layer..: Shared Domain

Module..............: Identifiers

Module ID...........: LOL-MOD-DOM-0003

LOL-ID..............: LOL-ID-0002

File................: media-id.ts

Location............
Library Of Legends/src/shared/domain/identifiers/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Base identifier for all media entities.

===============================================================================
*/

import { EntityId } from "./entity-id";

/**
 * Base identifier for all media entities.
 */
export abstract class MediaId extends EntityId {

    protected constructor(value: string) {

        super(value);

    }

}