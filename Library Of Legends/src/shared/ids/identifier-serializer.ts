/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: IdentifierSerializer

Architecture Layer..: Shared Kernel

Module..............: Shared Identifiers

Module ID...........: LOL-MOD-SHK-0010

LOL-ID..............: LOL-SHK-ID-0005

File................: identifier-serializer.ts

Location............
Library Of Legends/src/shared/ids/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Provides a centralized serializer for all Identifier implementations.

===============================================================================
*/

import { Identifier } from "./identifier";

export class IdentifierSerializer {

    /**
     * Converts an Identifier into its primitive value.
     */
    public static serialize<T>(
        identifier: Identifier<T>
    ): T {

        return identifier.toValue();

    }

    /**
     * Converts an Identifier into JSON.
     */
    public static toJson<T>(
        identifier: Identifier<T>
    ): string {

        return JSON.stringify(identifier.toValue());

    }

    /**
     * Converts a primitive value into an Identifier.
     */
    public static deserialize<TId extends Identifier<string>>(
        value: string,
        factory: (value: string) => TId
    ): TId {

        return factory(value);

    }

}