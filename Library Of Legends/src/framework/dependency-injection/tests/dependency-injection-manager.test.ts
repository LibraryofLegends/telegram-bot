/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: DependencyInjectionManager

Architecture Layer..: Framework Core

Module..............: Dependency Injection

Module ID...........: LOL-MOD-DI-0004

LOL-ID..............: LOL-FRM-DI-0010

File................: dependency-injection-manager.test.ts

Location............
Library Of Legends/src/framework/dependency-injection/tests/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Verifies the expected behavior of the DependencyInjectionManager
component.

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

• Service registration tests
• Dependency resolution tests
• Circular dependency tests
• Container validation tests
• Performance benchmarks

===============================================================================
*/

import { describe, expect, it } from "vitest";

import { DependencyInjectionManager } from "../src/dependency-injection-manager";

describe("DependencyInjectionManager", () => {

    it("should create a DependencyInjectionManager instance", () => {

        const manager = new DependencyInjectionManager();

        expect(manager).toBeInstanceOf(DependencyInjectionManager);

    });

    it("should initialize successfully", async () => {

        const manager = new DependencyInjectionManager();

        const result = await manager.initialize({

            defaultLifetime: "singleton"

        });

        expect(result.success).toBe(true);

        expect(result.state).toBe("ready");

        expect(result.options.defaultLifetime)
            .toBe("singleton");

    });

    it("should expose the current state", async () => {

        const manager = new DependencyInjectionManager();

        await manager.initialize({

            defaultLifetime: "transient"

        });

        expect(manager.getState()).toBe("ready");

    });

    it("should return the active configuration", async () => {

        const manager = new DependencyInjectionManager();

        await manager.initialize({

            defaultLifetime: "scoped"

        });

        expect(
            manager.getOptions().defaultLifetime
        ).toBe("scoped");

    });

});