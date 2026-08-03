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

Package.............: Model

Component...........: Person

LOL-ID..............: LOL-MEDIA-0003

File................: person.ts

Location............: src/media/model/

Dependencies........: None

Dependents..........:
- Movie
- Series
- Episode
- Metadata Capability
- TMDB Provider
- Search Engine

Stability...........: Stable

License.............: MIT

===============================================================================

DESCRIPTION

Represents a person involved in a media production.

A person may have one or multiple roles.

Examples

• Actor
• Director
• Writer
• Producer
• Composer
• Voice Actor

===============================================================================
*/

export enum PersonRole {

    ACTOR = "actor",

    DIRECTOR = "director",

    WRITER = "writer",

    PRODUCER = "producer",

    COMPOSER = "composer",

    CINEMATOGRAPHER = "cinematographer",

    EDITOR = "editor",

    VOICE_ACTOR = "voice_actor"

}

export class Person {

    /**
     * Internal Library ID.
     */
    public readonly id!: string;

    /**
     * TMDB identifier.
     */
    public tmdbId?: number;

    /**
     * IMDb identifier.
     */
    public imdbId?: string;

    /**
     * Full name.
     */
    public name = "";

    /**
     * Original name.
     */
    public originalName?: string;

    /**
     * Biography.
     */
    public biography?: string;

    /**
     * Birthday.
     */
    public birthday?: Date;

    /**
     * Death date.
     */
    public deathday?: Date;

    /**
     * Place of birth.
     */
    public placeOfBirth?: string;

    /**
     * Nationalities.
     */
    public nationalities: string[] = [];

    /**
     * Roles.
     */
    public roles: PersonRole[] = [];

    /**
     * Profile artwork.
     */
    public profileImage?: string;

    /**
     * Homepage.
     */
    public homepage?: string;

    /**
     * External links.
     */
    public externalIds =
        new Map<string, string>();

    /**
     * Tags.
     */
    public tags: string[] = [];

    /**
     * Creation timestamp.
     */
    public readonly createdAt =
        new Date();

    /**
     * Last modification.
     */
    public updatedAt =
        new Date();

}