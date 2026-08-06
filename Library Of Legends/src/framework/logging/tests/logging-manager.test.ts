/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: LoggingManager

Architecture Layer..: Framework Core

Module..............: Logging

Module ID...........: LOL-MOD-LOG-0003

LOL-ID..............: LOL-FRM-LOG-0010

File................: logging-manager.test.ts

Location............
Library Of Legends/src/framework/logging/tests/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Verifies the expected behavior of the LoggingManager component.

===============================================================================

Responsibilities

• Verify manager initialization
• Verify logging configuration
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

• Provider registration tests
• Logger integration tests
• Failure scenario tests
• Performance benchmarks
• Provider lifecycle tests

===============================================================================
*/

import { describe, expect, it } from "vitest";

import { LoggingManager } from "../src/logging-manager";

describe("LoggingManager", () => {

    it("should create a LoggingManager instance", () => {

        const manager = new LoggingManager();

        expect(manager).toBeInstanceOf(LoggingManager);

    });

    it("should initialize successfully", async () => {

        const manager = new LoggingManager();

        const result = await manager.initialize({

            minimumLevel: "info"

        });

        expect(result.success).toBe(true);

        expect(result.state).toBe("ready");

        expect(result.options.minimumLevel).toBe("info");

    });

    it("should expose the current state", async () => {

        const manager = new LoggingManager();

        await manager.initialize({

            minimumLevel: "debug"

        });

        expect(manager.getState()).toBe("ready");

    });

    it("should return the active logging configuration", async () => {

        const manager = new LoggingManager();

        await manager.initialize({

            minimumLevel: "warn"

        });

        expect(

            manager.getOptions().minimumLevel

        ).toBe("warn");

    });

});