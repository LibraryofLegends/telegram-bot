/*
===============================================================================
██╗     ██╗██████╗ ██████╗  █████╗ ██████╗ ██╗   ██╗
██║     ██║██╔══██╗██╔══██╗██╔══██╗██╔══██╗╚██╗ ██╔╝
██║     ██║██████╔╝██████╔╝███████║██████╔╝ ╚████╔╝
██║     ██║██╔══██╗██╔══██╗██╔══██║██╔══██╗  ╚██╔╝
███████╗██║██████╔╝██║  ██║██║  ██║██║  ██║   ██║
╚══════╝╚═╝╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝

                         PROJECT PHOENIX

===============================================================================

Project.............: Library Of Legends
Framework...........: LOAF

Module..............: Metadata
Package.............: Lexer

Component...........: Scanner Registry

LOL-ID..............: LOL-LEXER-0007

File................: scanner-registry.ts

Location............: src/core/services/metadata/lexer/

License.............: MIT

-------------------------------------------------------------------------------
DESCRIPTION
-------------------------------------------------------------------------------

Central registry responsible for managing all lexical scanners.

The registry is the only component that knows which scanners are available.

Scanners are automatically sorted by priority before execution.

===============================================================================
*/

/*
===============================================================================
IMPORTS
===============================================================================
*/

import { Scanner } from "./scanner";

/*
===============================================================================
SCANNER REGISTRY
===============================================================================
*/

export class ScannerRegistry {

    private readonly scanners: Scanner[] = [];

    /**
     * Register scanner.
     */
    public register(
        scanner: Scanner
    ): void {

        this.scanners.push(scanner);

        this.scanners.sort(
            (a, b) => a.priority - b.priority
        );

    }

    /**
     * Register multiple scanners.
     */
    public registerMany(
        scanners: Scanner[]
    ): void {

        for (const scanner of scanners) {

            this.register(scanner);

        }

    }

    /**
     * Remove scanner.
     */
    public unregister(
        name: string
    ): void {

        const index = this.scanners.findIndex(

            scanner => scanner.name === name

        );

        if (index >= 0) {

            this.scanners.splice(index, 1);

        }

    }

    /**
     * Remove all scanners.
     */
    public clear(): void {

        this.scanners.length = 0;

    }

    /**
     * Returns all scanners.
     */
    public getAll(): readonly Scanner[] {

        return this.scanners;

    }

    /**
     * Returns scanner by name.
     */
    public get(
        name: string
    ): Scanner | undefined {

        return this.scanners.find(

            scanner => scanner.name === name

        );

    }

    /**
     * Number of registered scanners.
     */
    public get size(): number {

        return this.scanners.length;

    }

}