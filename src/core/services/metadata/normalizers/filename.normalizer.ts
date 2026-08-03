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

Module..............: Metadata
Package.............: Normalizers

Component...........: Filename Normalizer

LOL-ID..............: LOL-NORMALIZER-0001

File................: filename.normalizer.ts

Location............: src/core/services/metadata/normalizers/

License.............: MIT

-------------------------------------------------------------------------------
DESCRIPTION
-------------------------------------------------------------------------------

Normalizes raw filenames before parsing.

This component creates a predictable filename format that can safely be
processed by all parsers.

===============================================================================
*/

/*
===============================================================================
ROADMAP
===============================================================================

[x] Trim filename

[x] Normalize separators

[x] Remove duplicate spaces

[x] Normalize brackets

[ ] Remove release group

[ ] Normalize Unicode

[ ] Normalize language tags

[ ] Normalize quality tags

[ ] Normalize source tags

===============================================================================
*/

export class FilenameNormalizer {

    /**
     * Normalize filename.
     */
    public normalize(fileName: string): string {

        let value = fileName;

        // trim

        value = value.trim();

        // replace separators

        value = value.replace(/[._]+/g, " ");

        // normalize dashes

        value = value.replace(/[–—-]+/g, " - ");

        // normalize brackets

        value = value.replace(/\(/g, " (");

        value = value.replace(/\)/g, ") ");

        // collapse spaces

        value = value.replace(/\s+/g, " ");

        return value.trim();

    }

}