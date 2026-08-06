/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: LogProvider

Architecture Layer..: Framework Core

Module..............: Logging

Module ID...........: LOL-MOD-LOG-0003

LOL-ID..............: LOL-FRM-LOG-0003

File................: log-provider.ts

Location............:
Library Of Legends/src/framework/logging/src/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Defines the official provider contract for all logging destinations used
by the Project Phoenix Framework.

===============================================================================

Responsibilities

• Define the logging provider contract
• Receive structured log entries
• Abstract logging destinations
• Enable provider extensibility
• Ensure provider consistency

===============================================================================

Design Decisions

• Interface-based architecture
• Provider independence
• Framework-wide compatibility
• Strong TypeScript typing
• Easy provider replacement

===============================================================================

Future Extensions

• Async providers
• Buffered providers
• Batch processing
• Provider health monitoring
• Retry strategies

===============================================================================
*/

import type { LogEntry } from "./log-entry";

/**
 * Official logging provider contract.
 */
export interface LogProvider {

    /**
     * Unique provider name.
     */
    readonly name: string;

    /**
     * Indicates whether the provider is available.
     */
    isAvailable(): boolean;

    /**
     * Writes a structured log entry.
     */
    write(
        entry: Readonly<LogEntry>
    ): Promise<void>;

    /**
     * Flushes pending log entries.
     */
    flush(): Promise<void>;

    /**
     * Releases provider resources.
     */
    dispose(): Promise<void>;

}