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

Component...........: Lexer Context

LOL-ID..............: LOL-LEXER-0005

File................: lexer-context.ts

Location............: src/core/services/metadata/lexer/

License.............: MIT

-------------------------------------------------------------------------------
DESCRIPTION
-------------------------------------------------------------------------------

Stores the complete runtime state of the lexer.

Every scanner operates on the same LexerContext.

===============================================================================
*/

import { Token } from "./token";

export class LexerContext {

    /**
     * Complete normalized filename.
     */
    public readonly input: string;

    /**
     * Current cursor position.
     */
    public position = 0;

    /**
     * Tokens generated so far.
     */
    public readonly tokens: Token[] = [];

    /**
     * Warning messages.
     */
    public readonly warnings: string[] = [];

    /**
     * Error messages.
     */
    public readonly errors: string[] = [];

    constructor(input: string) {

        this.input = input;

    }

    /**
     * Returns current character.
     */
    public current(): string | undefined {

        return this.input[this.position];

    }

    /**
     * Returns next character.
     */
    public peek(offset = 1): string | undefined {

        return this.input[this.position + offset];

    }

    /**
     * Move cursor.
     */
    public advance(step = 1): void {

        this.position += step;

    }

    /**
     * End of file reached.
     */
    public eof(): boolean {

        return this.position >= this.input.length;

    }

}