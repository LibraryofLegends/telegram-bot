/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: ConfigurationManager

Architecture Layer..: Framework Core

Module..............: Configuration

Module ID...........: LOL-MOD-CONF-0002

LOL-ID..............: LOL-FRM-CONF-0009

File................: configuration-manager.test.ts

Location............:
Library Of Legends/src/framework/configuration/tests/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Verifies the expected behavior of the ConfigurationManager component.

===============================================================================

Responsibilities

• Verify manager initialization
• Verify runtime configuration
• Verify manager state
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

• Loader integration tests
• Validator integration tests
• Provider integration tests
• Failure scenario tests
• Performance benchmarks

===============================================================================
*/

import { describe, expect, it } from "vitest";

import { ConfigurationManager } from "../src/configuration-manager";

describe("ConfigurationManager", () => {

    it("should create a ConfigurationManager instance", () => {

        const manager = new ConfigurationManager();

        expect(manager).toBeInstanceOf(ConfigurationManager);

    });

    it("should initialize successfully", async () => {

        const manager = new ConfigurationManager();

        const result = await manager.initialize({

            environment: "development"

        });

        expect(result.success).toBe(true);

        expect(result.state).toBe("ready");

        expect(result.configuration.environment)
            .toBe("development");

    });

    it("should expose the current state", async () => {

        const manager = new ConfigurationManager();

        await manager.initialize({

            environment: "development"

        });

        expect(manager.getState()).toBe("ready");

    });

    it("should return the active configuration", async () => {

        const manager = new ConfigurationManager();

        await manager.initialize({

            environment: "development"

        });

        expect(
            manager.getConfiguration().environment
        ).toBe("development");

    });

});