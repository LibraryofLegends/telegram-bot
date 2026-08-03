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

Component...........: Lexer Result

Feature-ID..........: FEATURE-001

LOL-ID..............: LOL-LEXER-0004

File................: lexer-result.ts

Location............: src/features/import/parser/lexer/

Dependencies........:
- token.ts

Dependents..........
- Lexer
- Parser
- AST Builder
- Debugger

Stability...........: Stable

===============================================================================

DESCRIPTION

Represents the complete output of the LOAF Media Lexer.

===============================================================================
*/

import { Token } from "./token";

export class LexerResult {

    /**
     * Produced tokens.
     */
    public readonly tokens: Token[] = [];

    /**
     * Lexer warnings.
     */
    public readonly warnings: string[] = [];

    /**
     * Lexer errors.
     */
    public readonly errors: string[] = [];

    /**
     * Processing time.
     */
    public duration = 0;

    /**
     * Original filename.
     */
    public originalInput = "";

    /**
     * Normalized filename.
     */
    public normalizedInput = "";

    /**
     * Adds a token.
     */
    public addToken(

        token: Token

    ): void {

        this.tokens.push(token);

    }

    /**
     * Returns all tokens of a given type.
     */
    public getTokens(

        type: number

    ): readonly Token[] {

        return this.tokens.filter(

            token => token.type === type

        );

    }

    /**
     * Returns whether lexer produced errors.
     */
    public hasErrors(): boolean {

        return this.errors.length > 0;

    }

}