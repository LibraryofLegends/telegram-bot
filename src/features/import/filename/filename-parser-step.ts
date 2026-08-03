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

Subsystem...........: Filename Parser

Module..............: Import

Component...........: Filename Parser Step

Feature-ID..........: FEATURE-001

LOL-ID..............: LOL-FILENAME-0001

File................: filename-parser-step.ts

Location............: src/features/import/filename/

Dependencies........:
- import-step.ts
- import-context.ts

Dependents..........:
- Media Detection
- TMDB Provider
- Duplicate Detection

Stability...........: Stable

===============================================================================

DESCRIPTION

Extracts structured information from media filenames.

No online lookups are performed here.

===============================================================================
*/

import { ImportContext } from "../import-context";
import { ImportStep } from "../import-step";

export class FilenameParserStep implements ImportStep {

    public readonly id = "filename";

    public readonly name = "Filename Parser";

    public readonly priority = 200;

    /**
     * Execute parser.
     */
    public async execute(

        context: ImportContext

    ): Promise<void> {

        //
        // TODO
        //
        // Parse title
        // Parse release year
        // Parse resolution
        // Parse source
        // Parse edition
        // Parse languages
        // Parse codec
        //

    }

}