/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: Bootstrap

Architecture Layer..: Framework Core

Module..............: Bootstrap

Module ID...........: LOL-MOD-BOOT-0001

LOL-ID..............: LOL-FRM-BOOT-0007

File................: bootstrap.test.ts

Location............:
Library Of Legends/src/framework/bootstrap/tests/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Verifies the expected behavior of the Bootstrap component.

===============================================================================

Responsibilities

• Verify framework startup
• Validate Bootstrap instance creation
• Validate startup result
• Ensure API stability
• Provide regression protection

===============================================================================

Design Decisions

• Uses Vitest as the official testing framework
• Independent unit tests
• Fast execution
• Deterministic assertions
• Easy future extension

===============================================================================

Future Extensions

• Startup validation tests
• Configuration validation tests
• Error handling tests
• Lifecycle tests
• Performance benchmarks

===============================================================================
*/

import { describe, expect, it } from "vitest";

import { Bootstrap } from "../src/bootstrap";

describe("Bootstrap", () => {

    it("should create a Bootstrap instance", () => {

        const bootstrap = new Bootstrap();

        expect(bootstrap).toBeInstanceOf(Bootstrap);

    });

    it("should start the framework successfully", async () => {

        const bootstrap = new Bootstrap();

        const result = await bootstrap.start({

            environment: "development"

        });

        expect(result.success).toBe(true);

        expect(result.context).toBeDefined();

        expect(result.startedAt).toBeInstanceOf(Date);

    });

});