/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: Studio

Architecture Layer..: Domain

Module..............: Catalog

Module ID...........: LOL-MOD-STU-0001

LOL-ID..............: LOL-STU-0001

File................: studio.ts

Location............
Library Of Legends/src/domain/catalog/studio/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Represents a production or publishing studio.

===============================================================================
*/

import { CatalogItem } from "../shared/catalog-item";
import { CatalogName } from "../shared/catalog-name";

import { StudioId } from "./studio-id";

/**
 * Represents a studio.
 */
export class Studio extends CatalogItem<
    StudioId,
    CatalogName
> {

    public constructor(
        id: StudioId,
        name: CatalogName
    ) {

        super(
            id,
            name
        );

    }

}