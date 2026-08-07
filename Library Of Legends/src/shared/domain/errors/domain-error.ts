/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: DomainError

Architecture Layer..: Shared Domain

Module..............: Domain Errors

Module ID...........: LOL-MOD-DOM-0002

LOL-ID..............: LOL-DOM-ERR-0001

File................: domain-error.ts

Location............
Library Of Legends/src/shared/domain/errors/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Base exception for all domain-related errors.

===============================================================================
*/

/**
 * Base class for all domain exceptions.
 */
export class DomainError extends Error {

    public constructor(message: string) {

        super(message);

        this.name = new.target.name;

    }

}