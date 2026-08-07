/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: Universe Tests

Architecture Layer..: Domain

Module..............: Catalog

Module ID...........: LOL-MOD-UNI-0001

LOL-ID..............: LOL-UNI-TEST-0001

File................: universe.test.ts

Location............
Library Of Legends/src/domain/catalog/universe/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Unit tests for the Universe aggregate.

===============================================================================
*/

import { describe, expect, it } from "vitest";

import { Universe } from "./universe";
import { UniverseId } from "./universe-id";

import { CatalogName } from "../shared/catalog-name";

describe("Universe", () => {

    const universe = new Universe(
        new UniverseId("UNI-000001"),
        new CatalogName("Marvel Universe")
    );

    it("should create a universe", () => {

        expect(universe.name.toString())
            .toBe("Marvel Universe");

    });

    it("should compare entities by identifier", () => {

        const other = new Universe(
            new UniverseId("UNI-000001"),
            new CatalogName("Marvel Universe")
        );

        expect(universe.equals(other))
            .toBe(true);

    });

    it("should not be equal when identifiers differ", () => {

        const other = new Universe(
            new UniverseId("UNI-000002"),
            new CatalogName("Marvel Universe")
        );

        expect(universe.equals(other))
            .toBe(false);

    });

});