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
Package.............: Parsers

Component...........: Title Parser

LOL-ID..............: LOL-PARSER-0001

File................: title.parser.ts

Location............: src/core/services/metadata/parsers/title.parser.ts

License.............: MIT

-------------------------------------------------------------------------------
DESCRIPTION
-------------------------------------------------------------------------------

Extracts the clean media title from filenames.

The parser removes

• Resolution
• Codec
• Audio Information
• Release Groups
• Source
• Edition
• Container
• Languages

and returns a normalized title.

===============================================================================
*/

/*
===============================================================================
ROADMAP
===============================================================================

[ ] Normalize separators

[ ] Remove release group

[ ] Remove year

[ ] Remove quality

[ ] Remove resolution

[ ] Remove codec

[ ] Remove HDR

[ ] Remove source

[ ] Remove edition

[ ] Cleanup title

===============================================================================
*/

export class TitleParser {

    /**
     * Parse title from filename.
     */
    public parse(fileName: string): string {

        let title = fileName;

        // remove extension

        title = title.replace(/\.[^.]+$/, "");

        // replace separators

        title = title.replace(/[._]/g, " ");

        // collapse spaces

        title = title.replace(/\s+/g, " ");

        title = title.trim();

        return title;

    }

}