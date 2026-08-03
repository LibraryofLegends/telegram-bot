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

Component...........: Media Node

Feature-ID..........: FEATURE-001

LOL-ID..............: LOL-AST-0004

File................: media-node.ts

Location............: src/features/import/compiler/ast/

Dependencies........:
- ast-node.ts
- ast-node-type.ts

Dependents..........
- MovieNode
- SeriesNode
- MusicNode
- BookNode
- ComicNode
- AudiobookNode

Stability...........: Stable

===============================================================================

DESCRIPTION

Base node for every media type.

===============================================================================
*/

import { AstNode } from "./ast-node";
import { AstNodeType } from "./ast-node-type";

export abstract class MediaNode extends AstNode {

    /**
     * Generic media node.
     */
    public readonly type = AstNodeType.MEDIA;

    /**
     * Media title.
     */
    public title?: string;

    /**
     * Original title.
     */
    public originalTitle?: string;

    /**
     * Release year.
     */
    public year?: number;

    /**
     * Detected language.
     */
    public language?: string;

    /**
     * Country.
     */
    public country?: string;

    /**
     * Confidence.
     */
    public confidence = 0;

}