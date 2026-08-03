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

Component...........: Pipeline Builder

LOL-ID..............: LOL-PIPELINE-0003

File................: pipeline-builder.ts

Location............: src/framework/pipeline/

Dependencies........:
- pipeline.ts
- pipeline-stage.ts

Dependents..........:
- Import Pipeline
- Compiler Pipeline
- Search Pipeline
- AI Pipeline

Stability...........: Stable

===============================================================================

DESCRIPTION

Fluent builder used to construct immutable pipelines.

===============================================================================
*/

import { Pipeline } from "./pipeline";
import { PipelineStage } from "./pipeline-stage";

export class PipelineBuilder<TContext> {

    private readonly stages: PipelineStage<TContext>[] = [];

    /**
     * Creates a new builder.
     */
    public static create<TContext>(): PipelineBuilder<TContext> {

        return new PipelineBuilder<TContext>();

    }

    /**
     * Adds a stage.
     */
    public add(

        stage: PipelineStage<TContext>

    ): this {

        this.stages.push(stage);

        return this;

    }

    /**
     * Builds the pipeline.
     */
    public build(): Pipeline<TContext> {

        const pipeline =

            new Pipeline<TContext>();

        this.stages

            .sort(

                (a, b) =>

                    a.priority - b.priority

            )

            .forEach(

                stage =>

                    pipeline.register(stage)

            );

        return pipeline;

    }

}