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

Component...........: Language

LOL-ID..............: LOL-MEDIA-0005

File................: language.ts

Location............: src/media/domain/value-objects/

Dependencies........: None

Dependents..........:
- Movie
- Series
- Episode
- Metadata Capability
- Search Engine
- TMDB Provider
- Telegram Publisher

Stability...........: Stable

License.............: MIT

===============================================================================

DESCRIPTION

Represents a language used by a media item.

Languages are immutable value objects shared throughout the media domain.

===============================================================================
*/

export class Language {

    constructor(

        /**
         * ISO 639-1 language code.
         */
        public readonly code: string,

        /**
         * English language name.
         */
        public readonly englishName: string,

        /**
         * Localized language name.
         */
        public readonly nativeName: string

    ) {}

    /**
     * Compare two language objects.
     */
    public equals(
        other: Language
    ): boolean {

        return this.code === other.code;

    }

    /**
     * Returns display name.
     */
    public toString(): string {

        return this.nativeName;

    }

}