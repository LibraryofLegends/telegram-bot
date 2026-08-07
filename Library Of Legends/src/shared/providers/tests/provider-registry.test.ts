/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: ProviderRegistry Tests

Architecture Layer..: Shared Kernel

Module..............: Provider SDK

Module ID...........: LOL-MOD-PRV-0011

LOL-ID..............: LOL-PRV-TST-0003

Description.........

Unit tests for ProviderRegistry.

===============================================================================
*/

import { describe, expect, it } from "vitest";

import { ProviderRegistry } from "../provider-registry";
import { TestProvider } from "./fixtures/test-provider";

describe("ProviderRegistry", () => {

    it("registers a provider", () => {

        const registry = new ProviderRegistry();

        const provider = new TestProvider();

        registry.register(provider);

        expect(
            registry.has(provider.metadata.type)
        ).toBe(true);

    });

    it("returns a registered provider", () => {

        const registry = new ProviderRegistry();

        const provider = new TestProvider();

        registry.register(provider);

        expect(
            registry.get(provider.metadata.type)
        ).toBe(provider);

    });

    it("returns all registered providers", () => {

        const registry = new ProviderRegistry();

        registry.register(new TestProvider());

        expect(
            registry.getAll()
        ).toHaveLength(1);

    });

    it("unregisters providers", () => {

        const registry = new ProviderRegistry();

        const provider = new TestProvider();

        registry.register(provider);

        registry.unregister(provider.metadata.type);

        expect(
            registry.has(provider.metadata.type)
        ).toBe(false);

    });

    it("clears the registry", () => {

        const registry = new ProviderRegistry();

        registry.register(new TestProvider());

        registry.clear();

        expect(
            registry.getAll()
        ).toHaveLength(0);

    });

});