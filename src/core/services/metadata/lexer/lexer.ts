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
Package.............: Lexer

Component...........: Lexer

LOL-ID..............: LOL-LEXER-0004

File................: lexer.ts

Location............: src/core/services/metadata/lexer/

License.............: MIT

-------------------------------------------------------------------------------
DESCRIPTION
-------------------------------------------------------------------------------

Transforms a normalized filename into a lexical TokenStream.

The lexer itself does NOT interpret media information.

Its only responsibility is lexical analysis.

===============================================================================
*/

/*
===============================================================================
IMPORTS
===============================================================================
*/

import { Token } from "./token";
import { TokenStream } from "./token-stream";

/*
===============================================================================
LEXER
===============================================================================
*/

export class Lexer {

    /**
     * Performs lexical analysis.
     */
    public tokenize(
        filename: string
    ): TokenStream {

        const tokens: Token[] = [];

        /*
         * Scanner implementation
         * will be added incrementally.
         */

        return new TokenStream(tokens);

    }

}