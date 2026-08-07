/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: Studio Tests

Architecture Layer..: Domain

Module..............: Catalog

Module ID...........: LOL-MOD-STU-0001

LOL-ID..............: LOL-STU-TEST-0001

File................: studio.test.ts

Location............
Library Of Legends/src/domain/catalog/studio/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Unit tests for the Studio aggregate.

===============================================================================
*/

import { describe, expect, it } from "vitest";

import { Studio } from "./studio";
import { StudioId } from "./studio-id";

import { CatalogName } from "../shared/catalog-name";

describe("Studio", () => {

    const studio = new Studio(
        new StudioId("STU-000001"),
        new CatalogName("Warner Bros.")
    );

    it("should create a studio", () => {

        expect(studio.name.toString())
            .toBe("Warner Bros.");

    });

    it("should compare entities by identifier", () => {

        const other = new Studio(
            new StudioId("STU-000001"),
            new CatalogName("Warner Bros.")
        );

        expect(studio.equals(other))
            .toBe(true);

    });

    it("should not be equal when identifiers differ", () => {

        const other = new Studio(
            new StudioId("STU-000002"),
            new CatalogName("Warner Bros.")
        );

        expect(studio.equals(other))
            .toBe(false);

    });

});