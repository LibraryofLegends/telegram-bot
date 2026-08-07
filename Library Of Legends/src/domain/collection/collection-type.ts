/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: CollectionType

Architecture Layer..: Domain

Module..............: Collection

Module ID...........: LOL-MOD-COL-0001

LOL-ID..............: LOL-COL-0004

File................: collection-type.ts

Location............
Library Of Legends/src/domain/collection/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Represents the type of a media collection.

===============================================================================
*/

import { DomainError } from "../../shared/domain/errors/domain-error";
import { ValueObject } from "../../shared/domain/value-objects/value-object";

/**
 * Represents the type of a collection.
 */
export class CollectionType extends ValueObject<string> {

    public static readonly Franchise = new CollectionType("Franchise");
    public static readonly Universe = new CollectionType("Universe");
    public static readonly BoxSet = new CollectionType("BoxSet");
    public static readonly Custom = new CollectionType("Custom");
    public static readonly Favorites = new CollectionType("Favorites");
    public static readonly Smart = new CollectionType("Smart");

    private constructor(value: string) {
        super(value);
    }

    /**
     * Creates a collection type from a string.
     */
    public static from(value: string): CollectionType {

        switch (value.trim().toLowerCase()) {

            case "franchise":
                return CollectionType.Franchise;

            case "universe":
                return CollectionType.Universe;

            case "boxset":
                return CollectionType.BoxSet;

            case "custom":
                return CollectionType.Custom;

            case "favorites":
                return CollectionType.Favorites;

            case "smart":
                return CollectionType.Smart;

            default:
                throw new DomainError(
                    `Unsupported collection type: ${value}`
                );

        }

    }

    public override toString(): string {
        return this.getValue();
    }

}