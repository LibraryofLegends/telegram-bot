/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: ProviderId

Architecture Layer..: Shared Kernel

Module..............: Shared Identifiers

Module ID...........: LOL-MOD-SHK-0010

LOL-ID..............: LOL-SHK-ID-0010

File................: provider-id.ts

Location............
Library Of Legends/src/shared/ids/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Strongly typed identifier representing an external provider.

===============================================================================
*/

import { IdentifierFactory } from "./identifier-factory";
import { StringIdentifier } from "./string-identifier";

/**
 * Strongly typed Provider identifier.
 */
export class ProviderId extends StringIdentifier {

    public constructor(value: string) {

        super(value);

    }

    /**
     * Creates a ProviderId from an existing value.
     */
    public static from(value: string): ProviderId {

        return new ProviderId(value);

    }

    /**
     * Generates a new ProviderId.
     */
    public static create(): ProviderId {

        return new ProviderId(
            IdentifierFactory.create()
        );

    }

}