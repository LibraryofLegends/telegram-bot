/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: SchedulerManager

Architecture Layer..: Framework Core

Module..............: Scheduler

Module ID...........: LOL-MOD-SCH-0008

LOL-ID..............: LOL-FRM-SCH-0009

File................: scheduler-manager.test.ts

Location............
Library Of Legends/src/framework/scheduler/tests/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Verifies the expected behavior of the SchedulerManager component.

===============================================================================

Responsibilities

• Verify manager initialization
• Verify configuration handling
• Verify scheduler state
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

• Task registration tests
• Job scheduling tests
• Cron parser tests
• Graceful shutdown tests
• Performance benchmarks

===============================================================================
*/

import { describe, expect, it } from "vitest";

import { SchedulerManager } from "../src/scheduler-manager";

describe("SchedulerManager", () => {

    it("should create a SchedulerManager instance", () => {

        const manager = new SchedulerManager();

        expect(manager).toBeInstanceOf(SchedulerManager);

    });

    it("should initialize successfully", async () => {

        const manager = new SchedulerManager();

        const result = await manager.initialize({

            autoStart: true

        });

        expect(result.success).toBe(true);

        expect(result.state).toBe("ready");

        expect(result.options.autoStart).toBe(true);

    });

    it("should expose the current scheduler state", async () => {

        const manager = new SchedulerManager();

        await manager.initialize({});

        expect(manager.getState()).toBe("ready");

    });

    it("should return the active scheduler configuration", async () => {

        const manager = new SchedulerManager();

        await manager.initialize({

            diagnostics: true

        });

        expect(
            manager.getOptions().diagnostics
        ).toBe(true);

    });

});