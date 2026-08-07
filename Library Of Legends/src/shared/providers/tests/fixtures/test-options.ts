/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: TestProviderOptions

Architecture Layer..: Shared Kernel

Module..............: Provider SDK

Module ID...........: LOL-MOD-PRV-0011

LOL-ID..............: LOL-PRV-TST-0101

Description.........

Reusable ProviderOptions fixture used across the Provider SDK
test suite.

===============================================================================
*/

import type { ProviderOptions } from "../../provider-options";

export const TEST_PROVIDER_OPTIONS: ProviderOptions = {

    enabled: true,

    type: "custom",

    endpoint: "https://localhost/provider",

    apiKey: "test-api-key",

    apiSecret: "test-api-secret",

    timeoutMs: 5000,

    maxRetries: 3,

    retryDelayMs: 250,

    requestsPerMinute: 120,

    cacheEnabled: false,

    cacheTtlSeconds: 0,

    fallbackEnabled: false,

    profile: "testing",

    custom: {

        environment: "test",

        debug: true

    }

};