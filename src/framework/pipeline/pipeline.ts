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

Component...........: Pipeline

LOL-ID..............: LOL-PIPELINE-0002

File................: pipeline.ts

Location............: src/framework/pipeline/

Dependencies........:
- pipeline-stage.ts

Dependents..........:
- PipelineExecutor
- PipelineRegistry
- ImportPipeline
- CompilerPipeline

Stability...........: Stable

===============================================================================

DESCRIPTION

Generic pipeline implementation.

A pipeline is only responsible for registering and ordering stages.
Execution is delegated to the PipelineExecutor.

===============================================================================
*/

import { PipelineStage } from "./pipeline-stage";

export class Pipeline<TContext> {

    private readonly stages: PipelineStage<TContext>[] = [];

    /**
     * Registers a new stage.
     */
    public register(

        stage: PipelineStage<TContext>

    ): void {

        this.stages.push(stage);

        this.stages.sort(

            (a, b) =>

                a.priority - b.priority

        );

    }

    /**
     * Returns all registered stages.
     */
    public getStages():

        readonly PipelineStage<TContext>[] {

        return this.stages;

    }

}