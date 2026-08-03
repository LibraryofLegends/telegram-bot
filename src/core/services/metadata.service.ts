/*
===============================================================================
██╗     ██╗██████╗ ██████╗  █████╗ ██████╗ ██╗   ██╗
██║     ██║██╔══██╗██╔══██╗██╔══██╗██╔══██╗╚██╗ ██╔╝
██║     ██║██████╔╝██████╔╝███████║██████╔╝ ╚████╔╝
██║     ██║██╔══██╗██╔══██╗██╔══██║██╔══██╗  ╚██╔╝
███████╗██║██████╔╝██║  ██║██║  ██║██║  ██║   ██║
╚══════╝╚═╝╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝

                         PROJECT PHOENIX

===============================================================================

Project.............: Library Of Legends
Framework...........: LOAF

Module..............: Core
Package.............: Services

Component...........: Metadata Service
LOL-ID..............: LOL-SERVICE-0001

File................: metadata.service.ts
Location............: src/core/services/metadata.service.ts

Author..............: Mr. Library Of Legends
Architecture........: Project Phoenix

License.............: MIT

-------------------------------------------------------------------------------
DESCRIPTION
-------------------------------------------------------------------------------

Extracts technical and descriptive metadata from imported media files.

This service is responsible for parsing filenames before external providers
(TMDB, AI, etc.) are queried.

-------------------------------------------------------------------------------
STATUS
-------------------------------------------------------------------------------

State...............: Development
Version.............: 1.0.0
Created.............: 2026-08-03

===============================================================================
*/

/*
===============================================================================
DEPENDENCIES
===============================================================================

Uses

- filename-parser.util
- quality-detector.util
- language-detector.util

Called By

- Library Engine

===============================================================================
*/

/*
===============================================================================
ROADMAP
===============================================================================

[ ] Filename Parser

[ ] Movie Detection

[ ] Series Detection

[ ] Year Detection

[ ] Resolution Detection

[ ] Quality Detection

[ ] Source Detection

[ ] Codec Detection

[ ] HDR Detection

[ ] Audio Detection

[ ] Language Detection

[ ] Edition Detection

===============================================================================
*/

/*
===============================================================================
CHANGELOG
===============================================================================

1.0.0

- Initial implementation

===============================================================================
*/

/*
===============================================================================
IMPORTS
===============================================================================
*/

export interface Metadata {

    title: string;

    originalTitle?: string;

    year?: number;

    mediaType?: "movie" | "series";

    resolution?: string;

    quality?: string;

    source?: string;

    videoCodec?: string;

    audioCodec?: string;

    language?: string[];

    hdr?: boolean;

    edition?: string;

    container?: string;

}

export class MetadataService {

    /**
     * Extract metadata from filename.
     */
    public async extract(
        fileName: string
    ): Promise<Metadata> {

        console.log("");

        console.log("==================================");
        console.log("Metadata Service");
        console.log("==================================");

        console.log(fileName);

        const metadata: Metadata = {

            title: this.extractTitle(fileName),

            year: this.extractYear(fileName),

            mediaType: this.detectMediaType(fileName),

            resolution: this.extractResolution(fileName),

            quality: this.extractQuality(fileName),

            source: this.extractSource(fileName),

            language: this.extractLanguages(fileName),

            container: this.extractContainer(fileName)

        };

        return metadata;

    }

    // -------------------------------------------------------------------------
    // Private Methods
    // -------------------------------------------------------------------------

    private extractTitle(fileName: string): string {

        return fileName;

    }

    private extractYear(fileName: string): number | undefined {

        return undefined;

    }

    private detectMediaType(
        fileName: string
    ): "movie" | "series" {

        if (/S\d{2}E\d{2}/i.test(fileName)) {

            return "series";

        }

        return "movie";

    }

    private extractResolution(
        fileName: string
    ): string | undefined {

        return undefined;

    }

    private extractQuality(
        fileName: string
    ): string | undefined {

        return undefined;

    }

    private extractSource(
        fileName: string
    ): string | undefined {

        return undefined;

    }

    private extractLanguages(
        fileName: string
    ): string[] {

        return [];

    }

    private extractContainer(
        fileName: string
    ): string | undefined {

        const parts = fileName.split(".");

        return parts.pop();

    }

}