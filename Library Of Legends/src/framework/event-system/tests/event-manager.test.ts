/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: EventManager

Architecture Layer..: Framework Core

Module..............: Event System

Module ID...........: LOL-MOD-EVT-0006

LOL-ID..............: LOL-FRM-EVT-0009

File................: event-manager.test.ts

Location............
Library Of Legends/src/framework/event-system/tests/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Verifies the expected behavior of the EventManager component.

===============================================================================

Responsibilities

• Verify manager initialization
• Verify configuration handling
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

• EventBus integration tests
• Listener registration tests
• Event publishing tests
• Error handling tests
• Performance benchmarks

===============================================================================
*/

import { describe, expect, it } from "vitest";

import { EventManager } from "../src/event-manager";

describe("EventManager", () => {

    it("should create an EventManager instance", () => {

        const manager = new EventManager();

        expect(manager).toBeInstanceOf(EventManager);

    });

    it("should initialize successfully", async () => {

        const manager = new EventManager();

        const result = await manager.initialize({

            asynchronous: true

        });

        expect(result.success).toBe(true);

        expect(result.state).toBe("ready");

        expect(result.options.asynchronous).toBe(true);

    });

    it("should expose the current state", async () => {

        const manager = new EventManager();

        await manager.initialize({});

        expect(manager.getState()).toBe("ready");

    });

    it("should return the active configuration", async () => {

        const manager = new EventManager();

        await manager.initialize({

            diagnostics: true

        });

        expect(
            manager.getOptions().diagnostics
        ).toBe(true);

    });

});