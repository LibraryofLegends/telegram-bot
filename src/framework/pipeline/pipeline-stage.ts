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

Subsystem...........: Pipeline

Component...........: Pipeline Stage

LOL-ID..............: LOL-PIPELINE-0001

File................: pipeline-stage.ts

Location............: src/framework/pipeline/

Stability...........: Stable

===============================================================================

DESCRIPTION

Base contract implemented by every pipeline stage.

===============================================================================
*/

export interface PipelineStage<
    TContext,
    TResult = void
> {

    /**
     * Unique stage identifier.
     */
    readonly id: string;

    /**
     * Display name.
     */
    readonly name: string;

    /**
     * Execution priority.
     */
    readonly priority: number;

    /**
     * Executes before the stage.
     */
    before?(
        context: TContext
    ): Promise<void>;

    /**
     * Main execution.
     */
    execute(
        context: TContext
    ): Promise<TResult>;

    /**
     * Executes after the stage.
     */
    after?(
        context: TContext
    ): Promise<void>;

    /**
     * Rollback.
     */
    rollback?(
        context: TContext,
        error: Error
    ): Promise<void>;

}