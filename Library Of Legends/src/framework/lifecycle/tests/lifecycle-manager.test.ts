/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: LifecycleManager

Architecture Layer..: Framework Core

Module..............: Lifecycle

Module ID...........: LOL-MOD-LIFE-0005

LOL-ID..............: LOL-FRM-LIFE-0008

File................: lifecycle-manager.test.ts

Location............
Library Of Legends/src/framework/lifecycle/tests/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Verifies the expected behavior of the LifecycleManager component.

===============================================================================

Responsibilities

• Verify manager initialization
• Verify lifecycle configuration
• Verify lifecycle state
• Verify lifecycle stage
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

• Hook execution tests
• Startup tests
• Shutdown tests
• Runtime coordination tests
• Performance benchmarks

===============================================================================
*/

import { describe, expect, it } from "vitest";

import { LifecycleManager } from "../src/lifecycle-manager";

describe("LifecycleManager", () => {

    it("should create a LifecycleManager instance", () => {

        const manager = new LifecycleManager();

        expect(manager).toBeInstanceOf(LifecycleManager);

    });

    it("should initialize successfully", async () => {

        const manager = new LifecycleManager();

        const result = await manager.initialize({

            initialStage: "initialize"

        });

        expect(result.success).toBe(true);

        expect(result.state).toBe("ready");

        expect(result.stage).toBe("initialize");

    });

    it("should expose the current lifecycle state", async () => {

        const manager = new LifecycleManager();

        await manager.initialize({

            initialStage: "initialize"

        });

        expect(manager.getState()).toBe("ready");

    });

    it("should return the active lifecycle configuration", async () => {

        const manager = new LifecycleManager();

        await manager.initialize({

            initialStage: "running"

        });

        expect(
            manager.getOptions().initialStage
        ).toBe("running");

    });

});