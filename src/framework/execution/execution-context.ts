/*
===============================================================================
██╗      ██████╗  █████╗ ███████╗
██║     ██╔═══██╗██╔══██╗██╔════╝
██║     ██║   ██║███████║█████╗
██║     ██║   ██║██╔══██║██╔══╝
███████╗╚██████╔╝██║  ██║██║
╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚═╝

                         LOAF FRAMEWORK

===============================================================================

Architecture Layer..: Framework

Subsystem...........: Execution Engine

Component...........: Execution Context

LOL-ID..............: LOL-EXECUTION-0001

File................: execution-context.ts

Location............: src/framework/execution/

Stability...........: Stable

===============================================================================

DESCRIPTION

Base execution context shared by every executable component inside LOAF.

===============================================================================
*/

export class ExecutionContext {

    /**
     * Unique execution id.
     */
    public readonly executionId!: string;

    /**
     * Arbitrary execution data.
     */
    public readonly values =
        new Map<string, unknown>();

    /**
     * Adds or replaces a value.
     */
    public set<T>(

        key: string,

        value: T

    ): void {

        this.values.set(

            key,

            value

        );

    }

    /**
     * Returns a value.
     */
    public get<T>(

        key: string

    ): T | undefined {

        return this.values.get(

            key

        ) as T | undefined;

    }

    /**
     * Checks whether a value exists.
     */
    public has(

        key: string

    ): boolean {

        return this.values.has(

            key

        );

    }

    /**
     * Removes a value.
     */
    public remove(

        key: string

    ): boolean {

        return this.values.delete(

            key

        );

    }

}