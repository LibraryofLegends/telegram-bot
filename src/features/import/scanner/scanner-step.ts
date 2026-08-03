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

Subsystem...........: Scanner

Module..............: Import

Component...........: Scanner Step

Feature-ID..........: FEATURE-001

LOL-ID..............: LOL-SCANNER-0001

File................: scanner-step.ts

Location............: src/features/import/scanner/

Dependencies........:
- import-step.ts
- import-job.ts

Dependents..........:
- Filename Parser
- Media Detector
- Duplicate Detection

Stability...........: Stable

===============================================================================

DESCRIPTION

Scans an import source and collects basic information.

The scanner intentionally performs NO metadata lookup.

===============================================================================
*/

import { ImportJob } from "../import-job";
import { ImportStep } from "../import-step";

export class ScannerStep implements ImportStep {

    public readonly id = "scanner";

    public readonly name = "Source Scanner";

    public readonly priority = 100;

    /**
     * Executes the scanner.
     */
    public async execute(

        job: ImportJob

    ): Promise<void> {

        job.progress = 5;

        //
        // TODO
        //
        // Detect source type
        // Read file information
        // Collect basic metadata
        // Create scan result
        //

    }

}