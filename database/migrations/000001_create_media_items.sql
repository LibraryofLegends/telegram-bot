-- =========================================================
-- Library Of Legends 2.0
-- Migration: 000001_create_media_items.sql
-- Beschreibung:
-- Erstellt die Basistabelle aller Medieneinträge.
-- =========================================================

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS media_items
(
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,

    media_type          TEXT NOT NULL,

    status              TEXT NOT NULL DEFAULT 'ACTIVE',

    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CHECK
    (
        media_type IN
        (
            'MOVIE',
            'SERIES',
            'SEASON',
            'EPISODE',
            'BOOK',
            'COMIC',
            'AUDIOBOOK',
            'AUDIOPLAY',
            'MAGAZINE',
            'GAME',
            'MUSIC',
            'DOCUMENTARY',
            'SHORT_FILM',
            'OTHER'
        )
    ),

    CHECK
    (
        status IN
        (
            'ACTIVE',
            'ARCHIVED',
            'DELETED'
        )
    )
);

------------------------------------------------------------
-- Indizes
------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_media_items_media_type
ON media_items(media_type);

CREATE INDEX IF NOT EXISTS idx_media_items_status
ON media_items(status);

CREATE INDEX IF NOT EXISTS idx_media_items_created_at
ON media_items(created_at);

------------------------------------------------------------
-- Trigger
------------------------------------------------------------

CREATE TRIGGER IF NOT EXISTS trg_media_items_updated_at
AFTER UPDATE
ON media_items
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE media_items
       SET updated_at = CURRENT_TIMESTAMP
     WHERE id = OLD.id;
END;

COMMIT;