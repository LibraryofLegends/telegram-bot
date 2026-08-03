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

Component...........: Parser Result

Feature-ID..........: FEATURE-001

LOL-ID..............: LOL-PARSER-0002

File................: parser-result.ts

Location............: src/features/import/parser/

Dependencies........:
- ../ast/ast-node.ts

Dependents..........
- Parser
- AST Builder
- Aggregate Builder

Stability...........: Stable

===============================================================================

DESCRIPTION

Represents the complete output of the parser.

The parser never creates domain objects.

It only produces an Abstract Syntax Tree.

===============================================================================
*/

import { AstNode } from "../ast/ast-node";

export class ParserResult {

    /**
     * Root AST node.
     */
    public root?: AstNode;

    /**
     * Parser warnings.
     */
    public readonly warnings: string[] = [];

    /**
     * Parser errors.
     */
    public readonly errors: string[] = [];

    /**
     * Processing duration.
     */
    public duration = 0;

    /**
     * Parser confidence.
     */
    public confidence = 0;

    /**
     * Returns true if parsing succeeded.
     */
    public isSuccessful(): boolean {

        return this.errors.length === 0 &&
               this.root !== undefined;

    }

}