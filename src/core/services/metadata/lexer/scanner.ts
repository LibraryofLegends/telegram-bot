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

Component...........: Scanner Interface

LOL-ID..............: LOL-LEXER-0006

File................: scanner.ts

Location............: src/core/services/metadata/lexer/

License.............: MIT

-------------------------------------------------------------------------------
DESCRIPTION
-------------------------------------------------------------------------------

Defines the contract for every lexical scanner used by Project Phoenix.

Every scanner must implement this interface.

The lexer does not know scanner implementations.

It only executes registered scanners.

===============================================================================
*/

/*
===============================================================================
IMPORTS
===============================================================================
*/

import { LexerContext } from "./lexer-context";

/*
===============================================================================
SCANNER
===============================================================================
*/

/**
 * Base interface for all lexer scanners.
 */
export interface Scanner {

    /**
     * Human readable scanner name.
     */
    readonly name: string;

    /**
     * Execution priority.
     *
     * Lower numbers execute first.
     */
    readonly priority: number;

    /**
     * Indicates whether this scanner should execute.
     */
    canScan(
        context: LexerContext
    ): boolean;

    /**
     * Execute scanner.
     */
    scan(
        context: LexerContext
    ): void;

}