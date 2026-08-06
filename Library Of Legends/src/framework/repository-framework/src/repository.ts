/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: Repository

Architecture Layer..: Framework Core

Module..............: Repository Framework

Module ID...........: LOL-MOD-REP-0007

LOL-ID..............: LOL-FRM-REP-0002

File................: repository.ts

Location............
Library Of Legends/src/framework/repository-framework/src/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Defines the official base repository contract used throughout the
Project Phoenix Framework.

===============================================================================

Responsibilities

• Define repository identity
• Standardize CRUD operations
• Support provider independence
• Enable repository lifecycle
• Ensure type-safe data access

===============================================================================

Design Decisions

• Generic interface
• Immutable repository metadata
• Provider-independent contract
• Framework-wide compatibility
• Easy extensibility

===============================================================================

Future Extensions

• Batch operations
• Query Builder integration
• Soft delete support
• Repository metrics
• Audit logging

===============================================================================
*/

/**
 * Official base repository contract.
 */
export interface Repository<TEntity, TIdentifier = string> {

    /**
     * Unique repository identifier.
     *
     * Example:
     * LOL-REP-MOVIES
     * LOL-REP-SERIES
     * LOL-REP-USERS
     */
    readonly id: string;

    /**
     * Human-readable repository name.
     */
    readonly name: string;

    /**
     * Returns all entities.
     */
    findAll(): Promise<readonly TEntity[]>;

    /**
     * Returns an entity by its identifier.
     */
    findById(
        id: TIdentifier
    ): Promise<TEntity | null>;

    /**
     * Creates a new entity.
     */
    create(
        entity: TEntity
    ): Promise<TEntity>;

    /**
     * Updates an existing entity.
     */
    update(
        entity: TEntity
    ): Promise<TEntity>;

    /**
     * Deletes an entity.
     */
    delete(
        id: TIdentifier
    ): Promise<boolean>;

}