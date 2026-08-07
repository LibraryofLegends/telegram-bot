/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: Collection Tests

Architecture Layer..: Domain

Module..............: Collection

Module ID...........: LOL-MOD-COL-0001

LOL-ID..............: LOL-COL-TEST-0001

File................: collection.test.ts

Location............
Library Of Legends/src/domain/collection/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Unit tests for the Collection aggregate.

===============================================================================
*/

import { describe, expect, it } from "vitest";

import { Collection } from "./collection";
import { CollectionId } from "./collection-id";
import { CollectionName } from "./collection-name";
import { CollectionType } from "./collection-type";

describe("Collection", () => {

    const collection = new Collection(
        new CollectionId("COL-000001"),
        new CollectionName("Marvel Cinematic Universe"),
        CollectionType.Universe
    );

    it("should create a collection", () => {

        expect(collection.name.toString())
            .toBe("Marvel Cinematic Universe");

        expect(collection.type)
            .toBe(CollectionType.Universe);

    });

    it("should compare entities by identifier", () => {

        const other = new Collection(
            new CollectionId("COL-000001"),
            new CollectionName("Marvel Cinematic Universe"),
            CollectionType.Universe
        );

        expect(collection.equals(other))
            .toBe(true);

    });

    it("should not be equal when identifiers differ", () => {

        const other = new Collection(
            new CollectionId("COL-000002"),
            new CollectionName("Marvel Cinematic Universe"),
            CollectionType.Universe
        );

        expect(collection.equals(other))
            .toBe(false);

    });

    it("should expose the collection type", () => {

        expect(collection.type.toString())
            .toBe("Universe");

    });

});