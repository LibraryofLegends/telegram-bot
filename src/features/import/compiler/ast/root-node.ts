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

Architecture Layer..: Compiler

Subsystem...........: AST

Module..............: Abstract Syntax Tree

Component...........: Root Node

Feature-ID..........: FEATURE-001

LOL-ID..............: LOL-AST-0003

File................: root-node.ts

Location............: src/features/import/compiler/ast/

Dependencies........:
- ast-node.ts
- ast-node-type.ts

Dependents..........
- Parser
- Validator
- Optimizer
- Aggregate Builder

Stability...........: Stable

===============================================================================

DESCRIPTION

Root node of every LOAF Media AST.

Exactly one RootNode exists per parsing process.

===============================================================================
*/

import { AstNode } from "./ast-node";
import { AstNodeType } from "./ast-node-type";

export class RootNode extends AstNode {

    /**
     * Root node type.
     */
    public readonly type = AstNodeType.ROOT;

    /**
     * Compiler version.
     */
    public compilerVersion = "1.0";

    /**
     * Source filename.
     */
    public source?: string;

    /**
     * Parse timestamp.
     */
    public readonly createdAt = new Date();

}