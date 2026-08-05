/*
===============================================================================

                    PROJECT PHOENIX

===============================================================================

Component...........: Provider Name

Architecture Layer..: Provider

Module..............: Module Name

LOL-ID..............: LOL-XXXX-0000

File................: provider-name.ts

Location............:
Library Of Legends/providers/module/

Version.............: 1.0.0

Status..............: Draft

Description.........

Provides communication with an external system such as APIs,
databases or third-party services.

===============================================================================
*/

export abstract class Provider {

    /**
     * Initializes the provider.
     */
    public abstract initialize(): Promise<void>;

    /**
     * Verifies the provider connection.
     */
    public abstract healthCheck(): Promise<boolean>;

    /**
     * Releases allocated resources.
     */
    public abstract dispose(): Promise<void>;

}