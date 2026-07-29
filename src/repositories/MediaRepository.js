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