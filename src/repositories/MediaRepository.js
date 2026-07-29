/**
 * ========================================================================
 * Library Of Legends 2.0
 * ------------------------------------------------------------------------
 * Datei:
 * src/repositories/MediaRepository.js
 * ------------------------------------------------------------------------
 * Beschreibung:
 *
 * Gemeinsames Repository für alle Medientypen.
 *
 * Diese Klasse enthält sämtliche Funktionen, die von Filmen,
 * Serien und Episoden gemeinsam genutzt werden.
 *
 * Version:
 * 1.0.0
 * ========================================================================
 */

'use strict';

const BaseRepository = require('./BaseRepository');

class MediaRepository extends BaseRepository {

    /**
     * ============================================================
     * Konstruktor
     * ============================================================
     */

    constructor(db, table) {

        super(db, table);

    }
    
        /**
     * ============================================================
     * Identifikatoren
     * ============================================================
     */

    findByTMDB(tmdbId) {

        return this.findOne({
            tmdb_id: tmdbId
        });

    }

    findByTVDB(tvdbId) {

        return this.findOne({
            tvdb_id: tvdbId
        });

    }

    findByIMDb(imdbId) {

        return this.findOne({
            imdb_id: imdbId
        });

    }

    findByLibraryId(id) {

        return this.findOne({
            library_id: id
        });

    }

    findByChecksum(checksum) {

        return this.findOne({
            checksum
        });

    }

    findByTelegramFileId(fileId) {

        return this.findOne({
            telegram_file_id: fileId
        });

    }

    findByTelegramMessageId(messageId) {

        return this.findOne({
            telegram_message_id: messageId
        });

    }
    
        /**
     * ============================================================
     * Titel
     * ============================================================
     */

    findByTitle(title) {

        return this.search([
            'title'
        ], title);

    }

    findByOriginalTitle(title) {

        return this.search([
            'original_title'
        ], title);

    }

    findBySortTitle(title) {

        return this.search([
            'sort_title'
        ], title);

    }

    findExactTitle(title) {

        return this.findAll({
            title
        });

    }

    startsWith(letter) {

        return this.where(
            'title',
            'LIKE',
            `${letter}%`
        );

    }

    endsWith(letter) {

        return this.where(
            'title',
            'LIKE',
            `%${letter}`
        );

    }
    
        /**
     * ============================================================
     * Suche
     * ============================================================
     */

    searchEverywhere(search) {

        return this.search([
            'title',
            'original_title',
            'overview',
            'tagline',
            'notes'
        ], search);

    }

    searchOverview(search) {

        return this.search([
            'overview'
        ], search);

    }

    searchTagline(search) {

        return this.search([
            'tagline'
        ], search);

    }

    searchNotes(search) {

        return this.search([
            'notes'
        ], search);

    }
    
        /**
     * ============================================================
     * Dashboard
     * ============================================================
     */

    latest(limit = 10) {

        return this
            .orderBy('created_at', 'DESC')
            .limit(limit);

    }

    recentlyUpdated(limit = 10) {

        return this
            .orderBy('updated_at', 'DESC')
            .limit(limit);

    }

    random(limit = 10) {

        return this.query(
            `
            SELECT *
            FROM ${this.table}
            WHERE deleted_at IS NULL
            ORDER BY RANDOM()
            LIMIT ?
            `,
            [limit]
        );

    }
    
        /**
     * ============================================================
     * Hilfsfunktionen
     * ============================================================
     */

    existsTMDB(tmdbId) {

        return this.exists({
            tmdb_id: tmdbId
        });

    }

    existsIMDb(imdbId) {

        return this.exists({
            imdb_id: imdbId
        });

    }

}

module.exports = MediaRepository;