/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: LibraryRepository

Architecture Layer..: Infrastructure

Module..............: Database

Module ID...........: LOL-MOD-DB-0001

LOL-ID..............: LOL-DB-0001

File................: library-repository.ts

Location............
Library Of Legends/src/infrastructure/database/

Version.............: 1.0.0

Status..............: Core

Lifecycle...........: Development

Description.........

Handles persistence of Library Items using PostgreSQL.

===============================================================================
*/

import { Pool } from "pg";
import { LibraryItem } from "../../domain/library/library-item";

/**
 * Database Connection Pool
 */
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

/**
 * Library Repository
 */
export class LibraryRepository {

    /**
     * Initialize table
     */
    public static async init(): Promise<void> {

        await pool.query(`
            CREATE TABLE IF NOT EXISTS library (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                type TEXT NOT NULL,
                file_name TEXT NOT NULL,
                created_at TIMESTAMP NOT NULL
            );
        `);

    }

    /**
     * Save item
     */
    public static async save(item: LibraryItem): Promise<void> {

        await pool.query(
            `
            INSERT INTO library (id, title, type, file_name, created_at)
            VALUES ($1, $2, $3, $4, $5)
            `,
            [
                item.id,
                item.title,
                item.type,
                item.fileName,
                item.createdAt
            ]
        );

    }

    /**
     * Get all items
     */
    public static async getAll(): Promise<LibraryItem[]> {

        const result = await pool.query(`SELECT * FROM library ORDER BY created_at DESC`);

        return result.rows.map(row => ({
            id: row.id,
            title: row.title,
            type: row.type,
            fileName: row.file_name,
            createdAt: new Date(row.created_at)
        }));

    }

    /**
     * Find by ID
     */
    public static async findById(id: string): Promise<LibraryItem | null> {

        const result = await pool.query(
            `SELECT * FROM library WHERE id = $1 LIMIT 1`,
            [id]
        );

        if (result.rows.length === 0) {
            return null;
        }

        const row = result.rows[0];

        return {
            id: row.id,
            title: row.title,
            type: row.type,
            fileName: row.file_name,
            createdAt: new Date(row.created_at)
        };

    }

}