/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: Franchise

Architecture Layer..: Domain

Module..............: Catalog

Module ID...........: LOL-MOD-FRA-0001

LOL-ID..............: LOL-FRA-0001

File................: franchise.ts

Location............
Library Of Legends/src/domain/catalog/franchise/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Represents a media franchise.

===============================================================================
*/

import { Entity } from "../../../shared/domain/entities/entity";

import { FranchiseId } from "./franchise-id";
import { FranchiseName } from "./franchise-name";

/**
 * Represents a franchise.
 */
export class Franchise extends Entity<FranchiseId> {

    public constructor(
        id: FranchiseId,
        public readonly name: FranchiseName
    ) {

        super(id);

    }

}