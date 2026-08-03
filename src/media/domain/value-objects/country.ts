/*
===============================================================================
██╗      ██████╗  █████╗ ███████╗
██║     ██╔═══██╗██╔══██╗██╔════╝
██║     ██║   ██║███████║█████╗
██║     ██║   ██║██╔══██║██╔══╝
███████╗╚██████╔╝██║  ██║██║
╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚═╝

          Library Of Legends Application Framework

===============================================================================

Architecture Layer..: Domain

Subsystem...........: Media

Module..............: Media Engine

Package.............: Value Objects

Component...........: Country

LOL-ID..............: LOL-MEDIA-0006

File................: country.ts

Location............: src/media/domain/value-objects/

Dependencies........: None

Dependents..........:
- Movie
- Series
- Episode
- Person
- Studio
- Metadata Capability
- Search Engine

Stability...........: Stable

License.............: MIT

===============================================================================

DESCRIPTION

Represents a country within the media domain.

Countries are immutable value objects identified by their ISO 3166-1
alpha-2 country code.

===============================================================================
*/

export class Country {

    constructor(

        /**
         * ISO 3166-1 alpha-2 code.
         * Example:
         * DE
         * US
         * GB
         * JP
         */
        public readonly code: string,

        /**
         * English country name.
         */
        public readonly englishName: string,

        /**
         * Localized country name.
         */
        public readonly nativeName: string

    ) {}

    /**
     * Returns whether two countries are equal.
     */
    public equals(
        other: Country
    ): boolean {

        return this.code === other.code;

    }

    /**
     * Display value.
     */
    public toString(): string {

        return this.nativeName;

    }

}