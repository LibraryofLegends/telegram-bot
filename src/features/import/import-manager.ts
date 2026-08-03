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

Component...........: Import Manager

Feature-ID..........: FEATURE-001

LOL-ID..............: LOL-IMPORT-0002

File................: import-manager.ts

Location............: src/features/import/

Dependencies........:
- import-job.ts
- import-pipeline.ts

Dependents..........:
- Telegram Import
- CLI Import
- Scanner
- API

Stability...........: Stable

===============================================================================

DESCRIPTION

Coordinates the complete lifecycle of every import.

The manager is responsible for creating, starting, tracking and
finishing import jobs.

===============================================================================
*/

import { ImportJob } from "./import-job";
import { ImportPipeline } from "./import-pipeline";

export class ImportManager {

    private readonly pipeline: ImportPipeline;

    constructor(
        pipeline: ImportPipeline
    ) {

        this.pipeline = pipeline;

    }

    /**
     * Starts a new import.
     */
    public async import(

        source: string

    ): Promise<ImportJob> {

        const job = new ImportJob();

        job.source = source;

        await this.pipeline.execute(job);

        return job;

    }

}