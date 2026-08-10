/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: LibraryStore

Architecture Layer..: Domain

Module..............: Library

Module ID...........: LOL-MOD-LIB-0003

LOL-ID..............: LOL-LIB-0003

File................: library-store.ts

Location............
Library Of Legends/src/domain/library/

Version.............: 1.0.0

Status..............: Core

Lifecycle...........: Development

Description.........

In-memory storage for Library Items.
Handles add, get, and list operations.

===============================================================================
*/

import { LibraryItem } from "./library-item";
import { LibraryId } from "./library-id";

/**
 * Library Store (In-Memory)
 */
export class LibraryStore {

    private static items: LibraryItem[] = [];

    /**
     * Add new item to library
     */
    public static add(title: string, type: "MOVIE" | "SERIES", fileName: string): LibraryItem {

        const item: LibraryItem = {
            id: LibraryId.next(),
            title,
            type,
            fileName,
            createdAt: new Date()
        };

        this.items.push(item);

        return item;
    }

    /**
     * Get all items
     */
    public static getAll(): LibraryItem[] {
        return this.items;
    }

    /**
     * Find by ID
     */
    public static findById(id: string): LibraryItem | undefined {
        return this.items.find(item => item.id === id);
    }

    /**
     * Find by Title
     */
    public static findByTitle(title: string): LibraryItem[] {
        return this.items.filter(item =>
            item.title.toLowerCase().includes(title.toLowerCase())
        );
    }

}