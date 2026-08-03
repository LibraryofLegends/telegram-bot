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

Component...........: Lexer

Feature-ID..........: FEATURE-001

LOL-ID..............: LOL-LEXER-0006

File................: lexer.ts

Location............: src/features/import/parser/lexer/

Dependencies........:
- lexer-context.ts
- lexer-result.ts
- lexer-rule.ts

Dependents..........
- Parser
- Filename Parser
- Import Pipeline

Stability...........: Stable

===============================================================================

DESCRIPTION

Main entry point of the LOAF Media Lexer.

Coordinates normalization, rule execution and token generation.

Contains no rule specific logic.

===============================================================================
*/

import { LexerContext } from "./lexer-context";
import { LexerResult } from "./lexer-result";
import { LexerRule } from "./lexer-rule";

export class Lexer {

    private readonly rules: LexerRule[] = [];

    /**
     * Registers a lexer rule.
     */
    public registerRule(

        rule: LexerRule

    ): void {

        this.rules.push(rule);

        this.rules.sort(

            (a, b) =>

                a.priority - b.priority

        );

    }

    /**
     * Executes the lexer.
     */
    public tokenize(

        input: string

    ): LexerResult {

        const context =

            new LexerContext(input);

        for (

            const rule of this.rules

        ) {

            context.registerRule(rule);

        }

        //
        // Normalization
        //

        context.normalizedInput =

            context.normalizedInput

                .replace(/[._]+/g, " ")

                .replace(/\s+/g, " ")

                .trim();

        //
        // Rule execution
        //

        const parts =

            context.normalizedInput.split(" ");

        let position = 0;

        for (

            const part of parts

        ) {

            for (

                const rule of context.rules

            ) {

                const token =

                    rule.match(

                        part,

                        position

                    );

                if (

                    token

                ) {

                    context.result.addToken(

                        token

                    );

                    break;

                }

            }

            position +=

                part.length + 1;

        }

        return context.finish();

    }

}