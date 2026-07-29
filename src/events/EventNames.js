/**
 * ========================================================================
 * Library Of Legends 2.0
 * ------------------------------------------------------------------------
 * Datei:
 * src/events/EventNames.js
 * ------------------------------------------------------------------------
 * Beschreibung:
 *
 * Enthält sämtliche Event-Konstanten des Systems.
 *
 * Version:
 * 1.0.0
 * ========================================================================
 */

'use strict';

module.exports = Object.freeze({

    /**
     * ============================================================
     * Filme
     * ============================================================
     */

    MOVIE_CREATED: 'movie.created',
    MOVIE_UPDATED: 'movie.updated',
    MOVIE_DELETED: 'movie.deleted',

    MOVIE_IMPORTED: 'movie.imported',

    MOVIE_METADATA_UPDATED: 'movie.metadata.updated',

    MOVIE_POSTER_UPDATED: 'movie.poster.updated',

    MOVIE_BACKDROP_UPDATED: 'movie.backdrop.updated',

    MOVIE_TRAILER_UPDATED: 'movie.trailer.updated',

    MOVIE_FAVORITE: 'movie.favorite',

    MOVIE_UNFAVORITE: 'movie.unfavorite',

    MOVIE_WATCHED: 'movie.watched',

    MOVIE_UNWATCHED: 'movie.unwatched',

    MOVIE_PROGRESS: 'movie.progress',

    /**
     * ============================================================
     * Serien
     * ============================================================
     */

    SERIES_CREATED: 'series.created',

    SERIES_UPDATED: 'series.updated',

    SERIES_DELETED: 'series.deleted',

    SERIES_IMPORTED: 'series.imported',

    SERIES_COMPLETED: 'series.completed',

    SERIES_METADATA_UPDATED: 'series.metadata.updated',

    SERIES_PROGRESS: 'series.progress',

    SERIES_FAVORITE: 'series.favorite',

    /**
     * ============================================================
     * Staffeln
     * ============================================================
     */

    SEASON_CREATED: 'season.created',

    SEASON_UPDATED: 'season.updated',

    SEASON_DELETED: 'season.deleted',

    /**
     * ============================================================
     * Episoden
     * ============================================================
     */

    EPISODE_CREATED: 'episode.created',

    EPISODE_UPDATED: 'episode.updated',

    EPISODE_DELETED: 'episode.deleted',

    EPISODE_IMPORTED: 'episode.imported',

    EPISODE_WATCHED: 'episode.watched',

    EPISODE_PROGRESS: 'episode.progress',

    /**
     * ============================================================
     * Import
     * ============================================================
     */

    IMPORT_STARTED: 'import.started',

    IMPORT_FILE_DETECTED: 'import.file.detected',

    IMPORT_METADATA: 'import.metadata',

    IMPORT_DUPLICATE: 'import.duplicate',

    IMPORT_FINISHED: 'import.finished',

    IMPORT_FAILED: 'import.failed',

    /**
     * ============================================================
     * Telegram
     * ============================================================
     */

    TELEGRAM_CONNECTED: 'telegram.connected',

    TELEGRAM_DISCONNECTED: 'telegram.disconnected',

    TELEGRAM_SYNC_STARTED: 'telegram.sync.started',

    TELEGRAM_SYNC_FINISHED: 'telegram.sync.finished',

    TELEGRAM_UPLOAD: 'telegram.upload',

    TELEGRAM_DOWNLOAD: 'telegram.download',

    TELEGRAM_MESSAGE_CREATED: 'telegram.message.created',

    TELEGRAM_MESSAGE_UPDATED: 'telegram.message.updated',

    /**
     * ============================================================
     * KI
     * ============================================================
     */

    AI_STARTED: 'ai.started',

    AI_FINISHED: 'ai.finished',

    AI_FAILED: 'ai.failed',

    AI_METADATA: 'ai.metadata',

    AI_DESCRIPTION: 'ai.description',

    AI_POSTER: 'ai.poster',

    AI_RECOMMENDATION: 'ai.recommendation',

    /**
     * ============================================================
     * Artwork
     * ============================================================
     */

    ARTWORK_UPDATED: 'artwork.updated',

    ARTWORK_POSTER: 'artwork.poster',

    ARTWORK_BACKDROP: 'artwork.backdrop',

    ARTWORK_LOGO: 'artwork.logo',

    /**
     * ============================================================
     * Dashboard
     * ============================================================
     */

    DASHBOARD_REFRESH: 'dashboard.refresh',

    STATISTICS_UPDATED: 'statistics.updated',

    /**
     * ============================================================
     * System
     * ============================================================
     */

    SYSTEM_STARTED: 'system.started',

    SYSTEM_READY: 'system.ready',

    SYSTEM_SHUTDOWN: 'system.shutdown',

    SYSTEM_ERROR: 'system.error',

    SYSTEM_BACKUP: 'system.backup',

    SYSTEM_MAINTENANCE: 'system.maintenance'

});