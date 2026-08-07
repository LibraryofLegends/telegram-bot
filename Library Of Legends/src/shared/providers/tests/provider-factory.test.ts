/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: ProviderFactory Tests

Architecture Layer..: Shared Kernel

Module..............: Provider SDK

Module ID...........: LOL-MOD-PRV-0011

LOL-ID..............: LOL-PRV-TST-0002

Description.........

Unit tests for ProviderFactory.

===============================================================================
*/

import { describe, expect, it } from "vitest";

import { ProviderFactory } from "../provider-factory";
import type { Provider } from "../provider";

class TestProvider implements Provider {

    public readonly metadata = {
        id: "test",
        name: "Test Provider",
        type: "custom",
        vendor: "Library Of Legends",
        version: "1.0.0",
        minimumFrameworkVersion: "1.0.0",
        compatibleFrameworkVersions: ["1.0.0"],
        priority: 1,
        fallback: false
    };

    public readonly capabilities = {
        supportsSearch: false,
        supportsMetadata: false,
        supportsImages: false,
        supportsStreaming: false,
        supportsUpload: false,
        supportsDownload: false,
        supportsAuthentication: false,
        supportsOAuth: false,
        supportsWebhooks: false,
        supportsRealtimeUpdates: false,
        supportsRateLimiting: false,
        supportsHealthChecks: true,
        supportsRetry: false,
        supportsCaching: false,
        supportsBatchRequests: false,
        supportsPlugins: false
    };

    public status = "created" as const;

    async initialize() {
        return {
            success: true,
            status: this.status,
            durationMs: 0,
            timestamp: new Date()
        };
    }

    async authenticate() {
        return {
            success: true,
            status: this.status,
            durationMs: 0,
            timestamp: new Date()
        };
    }

    async connect() {
        return {
            success: true,
            status: this.status,
            durationMs: 0,
            timestamp: new Date()
        };
    }

    async execute() {
        return {
            success: true,
            status: this.status,
            durationMs: 0,
            timestamp: new Date()
        };
    }

    async health() {
        return {
            success: true,
            status: this.status,
            durationMs: 0,
            timestamp: new Date()
        };
    }

    async disconnect() {
        return {
            success: true,
            status: this.status,
            durationMs: 0,
            timestamp: new Date()
        };
    }

    async shutdown() {
        return {
            success: true,
            status: this.status,
            durationMs: 0,
            timestamp: new Date()
        };
    }

}

describe("ProviderFactory", () => {

    it("creates provider instances", () => {

        const provider =
            ProviderFactory.create(TestProvider);

        expect(provider)
            .toBeInstanceOf(TestProvider);

    });

    it("returns different instances", () => {

        const first =
            ProviderFactory.create(TestProvider);

        const second =
            ProviderFactory.create(TestProvider);

        expect(first).not.toBe(second);

    });

});