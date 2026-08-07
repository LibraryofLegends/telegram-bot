/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: Media

Architecture Layer..: Shared Domain

Module..............: Entities

Module ID...........: LOL-MOD-DOM-0002

LOL-ID..............: LOL-ENT-0002

File................: media.ts

Location............
Library Of Legends/src/shared/domain/entities/

Version.............: 2.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Base entity for all media types.

===============================================================================
*/

import { Entity } from "./entity";

import { MediaId } from "../identifiers/media-id";
import { Title } from "../value-objects/title";
import { Year } from "../value-objects/year";

/**
 * Base entity for all media.
 */
export abstract class Media extends Entity<MediaId> {

    protected constructor(
        id: MediaId,
        public readonly title: Title,
        public readonly year: Year
    ) {

        super(id);

    }

}