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

Component...........: AST Node

Feature-ID..........: FEATURE-001

LOL-ID..............: LOL-AST-0001

File................: ast-node.ts

Location............: src/features/import/compiler/ast/

Stability...........: Stable

===============================================================================

DESCRIPTION

Base class of every node inside the LOAF Media AST.

Every AST element inherits from this class.

===============================================================================
*/

import { AstNodeType } from "./ast-node-type";

export abstract class AstNode {

    /**
     * Node type.
     */
    public abstract readonly type: AstNodeType;

    /**
     * Parent node.
     */
    public parent?: AstNode;

    /**
     * Child nodes.
     */
    public readonly children: AstNode[] = [];

    /**
     * Adds a child.
     */
    public addChild(

        node: AstNode

    ): void {

        node.parent = this;

        this.children.push(node);

    }

    /**
     * Removes a child.
     */
    public removeChild(

        node: AstNode

    ): void {

        const index =

            this.children.indexOf(node);

        if (

            index >= 0

        ) {

            this.children.splice(

                index,

                1

            );

        }

    }

    /**
     * Returns all children of a given type.
     */
    public findChildren(

        type: AstNodeType

    ): readonly AstNode[] {

        return this.children.filter(

            child =>

                child.type === type

        );

    }

}