/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: GenreDetectorTypes

Architecture Layer..: Domain

Module..............: Detection

Module ID...........: LOL-MOD-DET-0004

LOL-ID..............: LOL-DET-TYP-0001

File................: genre-detector-types.ts

Location............
Library Of Legends/src/domain/detection/

Version.............: 1.0.0

Status..............: Core

Description.........

Central type definitions for the Library Of Legends
automatic genre detection system.

===============================================================================
*/

export type LibraryGenre =
    | "Action"
    | "Abenteuer"
    | "Horror"
    | "Thriller"
    | "Sci-Fi"
    | "Fantasy"
    | "Drama"
    | "Romantik"
    | "Komödie"
    | "Familie"
    | "Animation"
    | "Anime"
    | "Mystery"
    | "Krimi"
    | "Dokumentation"
    | "Biografie"
    | "Western"
    | "Musik"
    | "Kinder"
    | "Unbekannt";