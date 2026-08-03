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

Subsystem...........: Import Pipeline

Module..............: Import

Component...........: Import Context

Feature-ID..........: FEATURE-001

LOL-ID..............: LOL-IMPORT-0005

File................: import-context.ts

Location............: src/features/import/

Stability...........: Stable

===============================================================================

DESCRIPTION

Shared context used by every pipeline step.

Each step enriches the context with additional information.

===============================================================================
*/

import { Asset } from "../../media/domain/entities/asset";
import { MediaVersion } from "../../media/domain/entities/media-version";
import { Movie } from "../../media/model/movie";

export class ImportContext {

    /**
     * Original import source.
     */
    public source!: string;

    /**
     * Source type.
     */
    public sourceType?: string;

    /**
     * Original filename.
     */
    public fileName?: string;

    /**
     * File extension.
     */
    public extension?: string;

    /**
     * File size.
     */
    public fileSize?: number;

    /**
     * SHA-256 checksum.
     */
    public checksum?: string;

    /**
     * Detected media type.
     */
    public mediaType?: string;

    /**
     * Parsed title.
     */
    public title?: string;

    /**
     * Parsed year.
     */
    public year?: number;

    /**
     * Asset.
     */
    public asset?: Asset;

    /**
     * Media version.
     */
    public version?: MediaVersion;

    /**
     * Movie entity.
     */
    public movie?: Movie;

    /**
     * Provider results.
     */
    public providerData =
        new Map<string, unknown>();

    /**
     * Warnings.
     */
    public warnings: string[] = [];

    /**
     * Errors.
     */
    public errors: string[] = [];

    /**
     * Debug information.
     */
    public debug =
        new Map<string, unknown>();

}