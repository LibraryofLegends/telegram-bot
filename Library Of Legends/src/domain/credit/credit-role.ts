/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: CreditRole

Architecture Layer..: Domain

Module..............: Credit

Module ID...........: LOL-MOD-CRE-0001

LOL-ID..............: LOL-CRE-0002

File................: credit-role.ts

Location............
Library Of Legends/src/domain/credit/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Defines the supported roles of a person within a media work.

===============================================================================
*/

/**
 * Represents the role of a person within a media work.
 */
export enum CreditRole {

    Actor = "Actor",

    Director = "Director",

    Writer = "Writer",

    Producer = "Producer",

    ExecutiveProducer = "ExecutiveProducer",

    Composer = "Composer",

    Editor = "Editor",

    Cinematographer = "Cinematographer",

    VoiceActor = "VoiceActor",

    Narrator = "Narrator",

    Creator = "Creator",

    Host = "Host"

}