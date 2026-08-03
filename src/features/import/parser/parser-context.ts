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

Subsystem...........: Parser

Module..............: Parser

Component...........: Parser Context

Feature-ID..........: FEATURE-001

LOL-ID..............: LOL-PARSER-0001

File................: parser-context.ts

Location............: src/features/import/parser/

Dependencies........:
- lexer-result.ts

Dependents..........
- Parser
- Grammar Engine
- AST Builder

Stability...........: Stable

===============================================================================

DESCRIPTION

Maintains the mutable state during parser execution.

===============================================================================
*/

import { LexerResult } from "./lexer/lexer-result";
import { Token } from "./lexer/token";

export class ParserContext {

    /**
     * Lexer output.
     */
    public readonly lexerResult: LexerResult;

    /**
     * Current parser position.
     */
    public position = 0;

    /**
     * Current token.
     */
    public current?: Token;

    /**
     * Parser warnings.
     */
    public readonly warnings: string[] = [];

    /**
     * Parser errors.
     */
    public readonly errors: string[] = [];

    /**
     * Parser debug information.
     */
    public readonly debug =
        new Map<string, unknown>();

    constructor(

        lexerResult: LexerResult

    ) {

        this.lexerResult = lexerResult;

        this.current =

            lexerResult.tokens[0];

    }

    /**
     * Returns true if more tokens are available.
     */
    public hasNext(): boolean {

        return this.position <

            this.lexerResult.tokens.length;

    }

    /**
     * Advances to the next token.
     */
    public next(): Token | undefined {

        this.position++;

        this.current =

            this.lexerResult.tokens[

                this.position

            ];

        return this.current;

    }

    /**
     * Returns the current token.
     */
    public peek(): Token | undefined {

        return this.current;

    }

}