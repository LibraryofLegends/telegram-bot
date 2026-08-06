/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: UserId

Architecture Layer..: Shared Kernel

Module..............: Shared Identifiers

Module ID...........: LOL-MOD-SHK-0010

LOL-ID..............: LOL-SHK-ID-0007

File................: user-id.ts

Location............
Library Of Legends/src/shared/ids/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Strongly typed identifier representing a platform user.

===============================================================================
*/

import { IdentifierFactory } from "./identifier-factory";
import { StringIdentifier } from "./string-identifier";

export class UserId extends StringIdentifier {

    public constructor(value: string) {

        super(value);

    }

    /**
     * Creates a UserId from an existing value.
     */
    public static from(value: string): UserId {

        return new UserId(value);

    }

    /**
     * Generates a new UserId.
     */
    public static create(): UserId {

        return new UserId(
            IdentifierFactory.create()
        );

    }

}