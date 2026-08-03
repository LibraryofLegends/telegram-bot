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

Architecture Layer..: Application

Subsystem...........: Lexer

Module..............: Parser

Component...........: Token Types

Feature-ID..........: FEATURE-001

LOL-ID..............: LOL-LEXER-0001

File................: token-type.ts

Location............: src/features/import/parser/lexer/

Stability...........: Stable

===============================================================================

DESCRIPTION

Defines every token that can be recognized by the LOAF Media Lexer.

===============================================================================
*/

export enum TokenType {

    UNKNOWN,

    TITLE,

    YEAR,

    SEASON,

    EPISODE,

    PART,

    DISC,

    EDITION,

    CUT,

    VERSION,

    SOURCE,

    RELEASE_GROUP,

    RESOLUTION,

    VIDEO_CODEC,

    AUDIO_CODEC,

    AUDIO_CHANNELS,

    AUDIO_LANGUAGE,

    SUBTITLE_LANGUAGE,

    HDR,

    CONTAINER,

    REGION,

    COUNTRY,

    PLATFORM,

    QUALITY,

    FORMAT,

    BIT_DEPTH,

    FRAME_RATE,

    TAG

}