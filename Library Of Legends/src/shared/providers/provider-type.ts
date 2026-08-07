/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: ProviderType

Architecture Layer..: Shared Kernel

Module..............: Provider SDK

Module ID...........: LOL-MOD-PRV-0011

LOL-ID..............: LOL-PRV-0001

File................: provider-type.ts

Location............
Library Of Legends/src/shared/providers/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Defines all supported provider categories used throughout the
Library Of Legends platform.

===============================================================================
*/

/**
 * Official provider categories.
 */
export type ProviderType =

    /* Metadata Providers */
    | "tmdb"
    | "omdb"
    | "imdb"
    | "thetvdb"
    | "fanart"

    /* Media Providers */
    | "telegram"
    | "cloudinary"
    | "supabase"
    | "local-storage"

    /* Media Servers */
    | "plex"
    | "jellyfin"
    | "emby"

    /* Tracking */
    | "trakt"

    /* Authentication */
    | "oauth"
    | "jwt"

    /* AI Providers */
    | "openai"

    /* Custom */
    | "custom";