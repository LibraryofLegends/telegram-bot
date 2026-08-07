/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: CatalogItem

Architecture Layer..: Domain

Module..............: Catalog Shared

Module ID...........: LOL-MOD-CAT-0001

LOL-ID..............: LOL-CAT-0001

File................: catalog-item.ts

Location............
Library Of Legends/src/domain/catalog/shared/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Abstract base entity for catalog objects.

===============================================================================
*/

import { Entity } from "../../../shared/domain/entities/entity";
import { EntityId } from "../../../shared/domain/identifiers/entity-id";

/**
 * Base class for all catalog entities.
 */
export abstract class CatalogItem<
    TId extends EntityId,
    TName
> extends Entity<TId> {

    protected constructor(
        id: TId,
        public readonly name: TName
    ) {

        super(id);

    }

}