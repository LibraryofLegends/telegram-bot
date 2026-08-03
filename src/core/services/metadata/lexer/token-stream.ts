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

Component...........: Token Stream

LOL-ID..............: LOL-LEXER-0003

File................: token-stream.ts

Location............: src/core/services/metadata/lexer/token-stream.ts

License.............: MIT

-------------------------------------------------------------------------------
DESCRIPTION
-------------------------------------------------------------------------------

Navigation and management layer for lexical tokens.

Every parser operates on a TokenStream instead of directly accessing
Token arrays.

The TokenStream provides navigation, look-ahead, searching and
state management.

===============================================================================
*/

/*
===============================================================================
IMPORTS
===============================================================================
*/

import { Token } from "./token";
import { TokenType } from "./token-type";

/*
===============================================================================
TOKEN STREAM
===============================================================================
*/

export class TokenStream {

    private position = 0;

    constructor(
        private readonly tokens: readonly Token[]
    ) {}

    /**
     * Total number of tokens.
     */
    public get length(): number {

        return this.tokens.length;

    }

    /**
     * Current parser position.
     */
    public get index(): number {

        return this.position;

    }

    /**
     * Returns true when end of stream is reached.
     */
    public get eof(): boolean {

        return this.position >= this.tokens.length;

    }

    /**
     * Current token.
     */
    public current(): Token | undefined {

        return this.tokens[this.position];

    }

    /**
     * Move to next token.
     */
    public next(): Token | undefined {

        if (!this.eof) {

            this.position++;

        }

        return this.current();

    }

    /**
     * Previous token.
     */
    public previous(): Token | undefined {

        if (this.position > 0) {

            this.position--;

        }

        return this.current();

    }

    /**
     * Look ahead.
     */
    public peek(offset = 1): Token | undefined {

        return this.tokens[this.position + offset];

    }

    /**
     * Look behind.
     */
    public peekBack(offset = 1): Token | undefined {

        return this.tokens[this.position - offset];

    }

    /**
     * Reset stream.
     */
    public reset(): void {

        this.position = 0;

    }

    /**
     * Jump to position.
     */
    public moveTo(position: number): void {

        this.position = Math.max(
            0,
            Math.min(position, this.tokens.length)
        );

    }

    /**
     * Returns first token of given type.
     */
    public find(type: TokenType): Token | undefined {

        return this.tokens.find(
            token => token.type === type
        );

    }

    /**
     * Returns all tokens of given type.
     */
    public findAll(type: TokenType): Token[] {

        return this.tokens.filter(
            token => token.type === type
        );

    }

    /**
     * Checks whether stream contains token.
     */
    public has(type: TokenType): boolean {

        return this.find(type) !== undefined;

    }

}