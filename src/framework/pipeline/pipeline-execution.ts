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

Component...........: Pipeline Execution

LOL-ID..............: LOL-PIPELINE-0004

File................: pipeline-execution.ts

Location............: src/framework/pipeline/

Dependencies........:
- pipeline.ts

Dependents..........:
- PipelineExecutor
- PipelineMetrics
- PipelineEvents

Stability...........: Stable

===============================================================================

DESCRIPTION

Represents a single execution of a pipeline.

Every pipeline run has exactly one PipelineExecution.

===============================================================================
*/

export enum PipelineExecutionStatus {

    CREATED,

    RUNNING,

    COMPLETED,

    FAILED,

    CANCELLED

}

export class PipelineExecution<TContext> {

    /**
     * Unique execution identifier.
     */
    public readonly id!: string;

    /**
     * Execution status.
     */
    public status =
        PipelineExecutionStatus.CREATED;

    /**
     * Pipeline context.
     */
    public readonly context: TContext;

    /**
     * Current stage.
     */
    public currentStage?: string;

    /**
     * Started timestamp.
     */
    public readonly startedAt =
        new Date();

    /**
     * Finished timestamp.
     */
    public finishedAt?: Date;

    /**
     * Error.
     */
    public error?: Error;

    constructor(

        context: TContext

    ) {

        this.context = context;

    }

    /**
     * Marks execution as running.
     */
    public start(): void {

        this.status =

            PipelineExecutionStatus.RUNNING;

    }

    /**
     * Marks execution as completed.
     */
    public complete(): void {

        this.status =

            PipelineExecutionStatus.COMPLETED;

        this.finishedAt =

            new Date();

    }

    /**
     * Marks execution as failed.
     */
    public fail(

        error: Error

    ): void {

        this.status =

            PipelineExecutionStatus.FAILED;

        this.error = error;

        this.finishedAt =

            new Date();

    }

}