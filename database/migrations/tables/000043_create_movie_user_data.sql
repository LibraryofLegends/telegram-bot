/*
================================================================
Library Of Legends 2.0
Migration: 000043_create_movie_user_data.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die zentrale Tabelle für benutzerspezifische
Filmdaten.

Diese Tabelle speichert ausschließlich persönliche
Informationen eines Benutzers und ist vollständig von
den eigentlichen Filmdaten getrennt.

Unterstützte Funktionen:
- Favoriten
- Watchlist
- Gesehen
- Eigene Bewertung
- Wiedergabefortschritt
- Letzte Wiedergabe
- Eigene Notizen
- Eigene Tags
- Archivstatus
- Benutzerstatistiken

Erstellt:
- movie_user_data

Abhängigkeiten:
- 000002_create_movies.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_user_data
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    movie_id INTEGER NOT NULL,

    user_id TEXT NOT NULL,

    is_favorite INTEGER NOT NULL DEFAULT 0,

    is_watchlist INTEGER NOT NULL DEFAULT 0,

    is_watched INTEGER NOT NULL DEFAULT 0,

    personal_rating REAL,

    watch_progress_seconds INTEGER NOT NULL DEFAULT 0,

    watch_percentage REAL NOT NULL DEFAULT 0,

    watch_count INTEGER NOT NULL DEFAULT 0,

    last_watched_at DATETIME,

    first_watched_at DATETIME,

    personal_tags TEXT,

    notes TEXT,

    custom_status TEXT,

    is_hidden INTEGER NOT NULL DEFAULT 0,

    is_archived INTEGER NOT NULL DEFAULT 0,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE
    (
        movie_id,
        user_id
    ),

    FOREIGN KEY (movie_id)
        REFERENCES movies(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_user_data_movie
ON movie_user_data(movie_id);

CREATE INDEX IF NOT EXISTS idx_movie_user_data_user
ON movie_user_data(user_id);

CREATE INDEX IF NOT EXISTS idx_movie_user_data_favorite
ON movie_user_data(is_favorite);

CREATE INDEX IF NOT EXISTS idx_movie_user_data_watchlist
ON movie_user_data(is_watchlist);

CREATE INDEX IF NOT EXISTS idx_movie_user_data_watched
ON movie_user_data(is_watched);

CREATE INDEX IF NOT EXISTS idx_movie_user_data_rating
ON movie_user_data(personal_rating);

CREATE INDEX IF NOT EXISTS idx_movie_user_data_progress
ON movie_user_data(watch_percentage);

CREATE INDEX IF NOT EXISTS idx_movie_user_data_last_watched
ON movie_user_data(last_watched_at);

CREATE INDEX IF NOT EXISTS idx_movie_user_data_hidden
ON movie_user_data(is_hidden);

CREATE INDEX IF NOT EXISTS idx_movie_user_data_archived
ON movie_user_data(is_archived);

COMMIT;