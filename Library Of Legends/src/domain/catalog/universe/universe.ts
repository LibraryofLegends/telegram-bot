/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: Universe

Architecture Layer..: Domain

Module..............: Catalog

Module ID...........: LOL-MOD-UNI-0001

LOL-ID..............: LOL-UNI-0001

File................: universe.ts

Location............
Library Of Legends/src/domain/catalog/universe/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Represents a fictional media universe.

===============================================================================
*/

import { CatalogItem } from "../shared/catalog-item";
import { CatalogName } from "../shared/catalog-name";

import { UniverseId } from "./universe-id";

/**
 * Represents a fictional universe.
 */
export class Universe extends CatalogItem<
    UniverseId,
    CatalogName
> {

    public constructor(
        id: UniverseId,
        name: CatalogName
    ) {

        super(id, name);

    }

}