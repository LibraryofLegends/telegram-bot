/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: LibraryItem

Architecture Layer..: Domain

Module..............: Library

Module ID...........: LOL-MOD-LIB-0001

LOL-ID..............: LOL-LIB-0001

File................: library-item.ts

Location............
Library Of Legends/src/domain/library/

Version.............: 1.0.0

Status..............: Core

Lifecycle...........: Development

Description.........

Represents a single item inside the Library.

===============================================================================
*/

export type LibraryItemType = "MOVIE" | "SERIES";

export interface LibraryItem {

    id: string;

    title: string;

    type: LibraryItemType;

    fileName: string;

    createdAt: Date;

}