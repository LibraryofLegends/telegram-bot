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

Subsystem...........: Lexer

Module..............: Parser

Component...........: Token

Feature-ID..........: FEATURE-001

LOL-ID..............: LOL-LEXER-0002

File................: token.ts

Location............: src/features/import/parser/lexer/

Dependencies........:
- token-type.ts

Dependents..........
- Lexer
- Parser
- Grammar Engine
- AST Builder

Stability...........: Stable

===============================================================================

DESCRIPTION

Represents one lexical token produced by the LOAF Media Lexer.

===============================================================================
*/

import { TokenType } from "./token-type";

export class Token {

    constructor(

        /**
         * Token type.
         */
        public readonly type: TokenType,

        /**
         * Original token text.
         */
        public readonly value: string,

        /**
         * Start position inside the original filename.
         */
        public readonly start: number,

        /**
         * End position.
         */
        public readonly end: number

    ) {}

    /**
     * Returns the token length.
     */
    public get length(): number {

        return this.end - this.start;

    }

    /**
     * Returns whether the token matches a specific type.
     */
    public is(

        type: TokenType

    ): boolean {

        return this.type === type;

    }

    /**
     * String representation.
     */
    public toString(): string {

        return `[${TokenType[this.type]}] ${this.value}`;

    }

}