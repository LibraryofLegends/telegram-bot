/*
===============================================================================

                    PROJECT PHOENIX

===============================================================================

Component...........: Repository Name

Architecture Layer..: Framework

Module..............: Module Name

LOL-ID..............: LOL-XXXX-0000

File................: repository-name.ts

Location............:
Library Of Legends/framework/module/

Version.............: 1.0.0

Status..............: Draft

Description.........

Provides centralized data access for a specific domain.

Repositories are responsible for loading, storing, updating and deleting
data. They shall not contain business logic.

===============================================================================
*/

export abstract class Repository<T> {

    /**
     * Returns all entities.
     */
    public abstract findAll(): Promise<T[]>;

    /**
     * Returns a single entity.
     */
    public abstract findById(
        id: string
    ): Promise<T | null>;

    /**
     * Saves an entity.
     */
    public abstract save(
        entity: T
    ): Promise<void>;

    /**
     * Deletes an entity.
     */
    public abstract delete(
        id: string
    ): Promise<void>;

}