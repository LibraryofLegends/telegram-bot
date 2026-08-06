/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: HealthManager

Architecture Layer..: Framework Core

Module..............: Health Monitoring

Module ID...........: LOL-MOD-HLT-0009

LOL-ID..............: LOL-FRM-HLT-0009

File................: health-manager.test.ts

Location............
Library Of Legends/src/framework/health-monitoring/tests/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Verifies the expected behavior of the HealthManager component.

===============================================================================
*/

import { describe, expect, it } from "vitest";

import { HealthManager } from "../src/health-manager";

describe("HealthManager", () => {

    it("should create a HealthManager instance", () => {

        const manager = new HealthManager();

        expect(manager).toBeInstanceOf(HealthManager);

    });

    it("should initialize successfully", async () => {

        const manager = new HealthManager();

        const result = await manager.initialize({

            diagnostics: true

        });

        expect(result.success).toBe(true);

        expect(result.state).toBe("ready");

        expect(result.options.diagnostics).toBe(true);

    });

    it("should expose the current health state", async () => {

        const manager = new HealthManager();

        await manager.initialize({});

        expect(manager.getState()).toBe("ready");

    });

    it("should return the active health configuration", async () => {

        const manager = new HealthManager();

        await manager.initialize({

            metrics: true,

            snapshots: true

        });

        expect(
            manager.getOptions().metrics
        ).toBe(true);

        expect(
            manager.getOptions().snapshots
        ).toBe(true);

    });

});