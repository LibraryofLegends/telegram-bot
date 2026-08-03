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

Component...........: Import Step

Feature-ID..........: FEATURE-001

LOL-ID..............: LOL-IMPORT-0004

File................: import-step.ts

Location............: src/features/import/

Dependencies........:
- import-job.ts

Dependents..........:
- Scanner Step
- Filename Step
- Duplicate Step
- Metadata Step
- FFprobe Step
- Artwork Step
- Database Step
- Search Step
- Telegram Step

Stability...........: Stable

===============================================================================

DESCRIPTION

Every processing stage inside the import pipeline implements this
interface.

===============================================================================
*/

import { ImportJob } from "./import-job";

export interface ImportStep {

    /**
     * Unique identifier.
     */
    readonly id: string;

    /**
     * Display name.
     */
    readonly name: string;

    /**
     * Execution order.
     */
    readonly priority: number;

    /**
     * Executes the pipeline step.
     */
    execute(

        job: ImportJob

    ): Promise<void>;

}