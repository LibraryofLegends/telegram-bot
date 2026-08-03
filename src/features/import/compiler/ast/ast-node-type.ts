/*
===============================================================================
██╗      ██████╗  █████╗ ███████╗
██║     ██╔═══██╗██╔══██╗██╔════╝
██║     ██║   ██║███████║█████╗
██║     ██║   ██║██╔══██║██╔══╝
███████╗╚██████╔╝██║  ██║██║
╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚═╝

                    PROJECT PHOENIX

===============================================================================

Feature.............: Universal Media Import

Architecture Layer..: Compiler

Subsystem...........: AST

Module..............: Abstract Syntax Tree

Component...........: AST Node Types

Feature-ID..........: FEATURE-001

LOL-ID..............: LOL-AST-0002

File................: ast-node-type.ts

Location............: src/features/import/compiler/ast/

Stability...........: Stable

===============================================================================

DESCRIPTION

Defines every supported AST node type.

===============================================================================
*/

export enum AstNodeType {

    ROOT,

    MEDIA,

    MOVIE,

    SERIES,

    EPISODE,

    MUSIC,

    AUDIOBOOK,

    BOOK,

    COMIC,

    MAGAZINE,

    TITLE,

    ORIGINAL_TITLE,

    YEAR,

    SEASON,

    EPISODE_NUMBER,

    PART,

    DISC,

    EDITION,

    SOURCE,

    QUALITY,

    RESOLUTION,

    VIDEO_CODEC,

    AUDIO_CODEC,

    AUDIO_CHANNELS,

    HDR,

    LANGUAGE,

    SUBTITLE,

    COUNTRY,

    STUDIO,

    GENRE,

    PERSON,

    RATING,

    RELEASE_GROUP,

    PLATFORM,

    CONTAINER,

    FILE,

    VERSION,

    ARTWORK,

    METADATA,

    TAG,

    UNKNOWN

}