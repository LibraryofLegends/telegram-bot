/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: RepositoryManager

Architecture Layer..: Framework Core

Module..............: Repository Framework

Module ID...........: LOL-MOD-REP-0007

LOL-ID..............: LOL-FRM-REP-0009

File................: repository-manager.test.ts

Location............
Library Of Legends/src/framework/repository-framework/tests/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Verifies the expected behavior of the RepositoryManager component.

===============================================================================

Responsibilities

• Verify manager initialization
• Verify configuration handling
• Verify repository framework state
• Validate immutable configuration
• Prevent regressions

===============================================================================

Design Decisions

• Uses Vitest
• Independent unit tests
• Deterministic assertions
• Fast execution
• Easy future extension

===============================================================================

Future Extensions

• Repository registration tests
• Provider registration tests
• Transaction integration tests
• Repository discovery tests
• Performance benchmarks

===============================================================================
*/

import { describe, expect, it } from "vitest";

import { RepositoryManager } from "../src/repository-manager";

describe("RepositoryManager", () => {

    it("should create a RepositoryManager instance", () => {

        const manager = new RepositoryManager();

        expect(manager).toBeInstanceOf(RepositoryManager);

    });

    it("should initialize successfully", async () => {

        const manager = new RepositoryManager();

        const result = await manager.initialize({

            defaultProvider: "LOL-PROV-SQLITE"

        });

        expect(result.success).toBe(true);

        expect(result.state).toBe("ready");

        expect(result.options.defaultProvider)
            .toBe("LOL-PROV-SQLITE");

    });

    it("should expose the current repository state", async () => {

        const manager = new RepositoryManager();

        await manager.initialize({

            defaultProvider: "LOL-PROV-SQLITE"

        });

        expect(manager.getState()).toBe("ready");

    });

    it("should return the active repository configuration", async () => {

        const manager = new RepositoryManager();

        await manager.initialize({

            defaultProvider: "LOL-PROV-SQLITE",

            diagnostics: true

        });

        expect(
            manager.getOptions().diagnostics
        ).toBe(true);

    });

});