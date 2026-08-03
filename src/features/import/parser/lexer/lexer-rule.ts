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

Component...........: Lexer Rule

Feature-ID..........: FEATURE-001

LOL-ID..............: LOL-LEXER-0003

File................: lexer-rule.ts

Location............: src/features/import/parser/lexer/

Stability...........: Stable

===============================================================================

DESCRIPTION

Base interface implemented by every lexer rule.

Each rule is responsible for recognizing exactly one type of token.

===============================================================================
*/

import { Token } from "./token";

export interface LexerRule {

    /**
     * Unique rule identifier.
     */
    readonly id: string;

    /**
     * Rule execution priority.
     *
     * Lower values execute first.
     */
    readonly priority: number;

    /**
     * Attempts to recognize a token.
     *
     * Returns null if the rule does not match.
     */
    match(

        value: string,

        start: number

    ): Token | null;

}