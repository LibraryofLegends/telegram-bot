/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: Franchise Tests

Architecture Layer..: Domain

Module..............: Catalog

Module ID...........: LOL-MOD-FRA-0001

LOL-ID..............: LOL-FRA-TEST-0001

File................: franchise.test.ts

Location............
Library Of Legends/src/domain/catalog/franchise/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Unit tests for the Franchise aggregate.

===============================================================================
*/

import { describe, expect, it } from "vitest";

import { Franchise } from "./franchise";
import { FranchiseId } from "./franchise-id";
import { FranchiseName } from "./franchise-name";

describe("Franchise", () => {

    const franchise = new Franchise(
        new FranchiseId("FRA-000001"),
        new FranchiseName("Harry Potter")
    );

    it("should create a franchise", () => {

        expect(franchise.name.toString())
            .toBe("Harry Potter");

    });

    it("should compare entities by identifier", () => {

        const other = new Franchise(
            new FranchiseId("FRA-000001"),
            new FranchiseName("Harry Potter")
        );

        expect(franchise.equals(other))
            .toBe(true);

    });

    it("should not be equal when identifiers differ", () => {

        const other = new Franchise(
            new FranchiseId("FRA-000002"),
            new FranchiseName("Harry Potter")
        );

        expect(franchise.equals(other))
            .toBe(false);

    });

});