/*
===============================================================================
██╗      ██████╗  █████╗ ███████╗
██║     ██╔═══██╗██╔══██╗██╔════╝
██║     ██║   ██║███████║█████╗
██║     ██║   ██║██╔══██║██╔══╝
███████╗╚██████╔╝██║  ██║██║
╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚═╝

                    PROJECT PHOENIX

===============================================================================

Feature.............: Universal Media Import

Architecture Layer..: Application

Subsystem...........: Import Pipeline

Module..............: Import

Component...........: Import Pipeline

Feature-ID..........: FEATURE-001

LOL-ID..............: LOL-IMPORT-0003

File................: import-pipeline.ts

Location............: src/features/import/

Dependencies........:
- import-job.ts
- import-step.ts

Dependents..........:
- Import Manager

Stability...........: Stable

===============================================================================

DESCRIPTION

Executes every registered import step.

The pipeline itself contains no import logic.

===============================================================================
*/

import { ImportJob } from "./import-job";
import { ImportStep } from "./import-step";

export class ImportPipeline {

    private readonly steps: ImportStep[] = [];

    /**
     * Registers a pipeline step.
     */
    public register(

        step: ImportStep

    ): void {

        this.steps.push(step);

    }

    /**
     * Executes the complete pipeline.
     */
    public async execute(

        job: ImportJob

    ): Promise<void> {

        for (

            const step of this.steps

        ) {

            await step.execute(job);

        }

    }

}