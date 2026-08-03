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

Component...........: Lexer Context

Feature-ID..........: FEATURE-001

LOL-ID..............: LOL-LEXER-0005

File................: lexer-context.ts

Location............: src/features/import/parser/lexer/

Dependencies........:
- lexer-result.ts
- lexer-rule.ts

Dependents..........
- Lexer

Stability...........: Stable

===============================================================================

DESCRIPTION

Maintains the mutable state of a lexer execution.

===============================================================================
*/

import { LexerResult } from "./lexer-result";
import { LexerRule } from "./lexer-rule";

export class LexerContext {

    /**
     * Original filename.
     */
    public readonly input: string;

    /**
     * Normalized filename.
     */
    public normalizedInput: string;

    /**
     * Current cursor position.
     */
    public position = 0;

    /**
     * Active lexer rules.
     */
    public readonly rules: LexerRule[] = [];

    /**
     * Lexer output.
     */
    public readonly result = new LexerResult();

    /**
     * Lexer start timestamp.
     */
    public readonly startedAt = Date.now();

    constructor(

        input: string

    ) {

        this.input = input;

        this.normalizedInput = input;

        this.result.originalInput = input;

    }

    /**
     * Registers a lexer rule.
     */
    public registerRule(

        rule: LexerRule

    ): void {

        this.rules.push(rule);

    }

    /**
     * Finishes the lexer execution.
     */
    public finish(): LexerResult {

        this.result.normalizedInput =

            this.normalizedInput;

        this.result.duration =

            Date.now() - this.startedAt;

        return this.result;

    }

}