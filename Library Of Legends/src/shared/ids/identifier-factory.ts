/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: IdentifierFactory

Architecture Layer..: Shared Kernel

Module..............: Shared Identifiers

Module ID...........: LOL-MOD-SHK-0010

LOL-ID..............: LOL-SHK-ID-0004

File................: identifier-factory.ts

Location............
Library Of Legends/src/shared/ids/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Central factory responsible for generating identifiers throughout the
Library Of Legends platform.

===============================================================================
*/

export type IdentifierStrategy =
    | "uuid"
    | "ulid"
    | "nanoid";

export class IdentifierFactory {

    private static strategy: IdentifierStrategy = "uuid";

    /**
     * Sets the active identifier strategy.
     */
    public static use(
        strategy: IdentifierStrategy
    ): void {

        this.strategy = strategy;

    }

    /**
     * Generates a new identifier.
     */
    public static create(): string {

        switch (this.strategy) {

            case "uuid":
                return crypto.randomUUID();

            case "ulid":

                /*
                 * Placeholder implementation.
                 * Will be replaced by the ULID provider.
                 */
                return crypto.randomUUID();

            case "nanoid":

                /*
                 * Placeholder implementation.
                 * Will be replaced by the NanoID provider.
                 */
                return crypto.randomUUID();

            default:

                throw new Error(
                    "Unsupported identifier strategy."
                );

        }

    }

    /**
     * Returns the currently active strategy.
     */
    public static getStrategy(): IdentifierStrategy {

        return this.strategy;

    }

}