/**
 * ========================================================================
 * Library Of Legends 2.0
 * ------------------------------------------------------------------------
 * Datei:
 * src/repositories/RepositoryManager.js
 * ------------------------------------------------------------------------
 * Beschreibung:
 *
 * Zentrale Verwaltung aller Repositories.
 *
 * Diese Klasse erstellt sämtliche Repository-Instanzen
 * und stellt sie zentral zur Verfügung.
 *
 * Version:
 * 1.0.0
 * ========================================================================
 */

'use strict';

const MovieRepository = require('./MovieRepository');
const SeriesRepository = require('./SeriesRepository');
const SeasonRepository = require('./SeasonRepository');
const EpisodeRepository = require('./EpisodeRepository');

const PersonRepository = require('./PersonRepository');
const GenreRepository = require('./GenreRepository');
const CollectionRepository = require('./CollectionRepository');
const StudioRepository = require('./StudioRepository');
const CompanyRepository = require('./CompanyRepository');
const CountryRepository = require('./CountryRepository');
const LanguageRepository = require('./LanguageRepository');

const FileRepository = require('./FileRepository');
const UserRepository = require('./UserRepository');
const WorkflowRepository = require('./WorkflowRepository');
const AIJobRepository = require('./AIJobRepository');

class RepositoryManager {

    /**
     * ============================================================
     * Konstruktor
     * ============================================================
     */

    constructor(db) {

        this.db = db;

        /**
         * ========================================================
         * Medien
         * ========================================================
         */

        this.movies = new MovieRepository(db);
        this.series = new SeriesRepository(db);
        this.seasons = new SeasonRepository(db);
        this.episodes = new EpisodeRepository(db);

        /**
         * ========================================================
         * Stammdaten
         * ========================================================
         */

        this.people = new PersonRepository(db);
        this.genres = new GenreRepository(db);
        this.collections = new CollectionRepository(db);
        this.studios = new StudioRepository(db);
        this.companies = new CompanyRepository(db);
        this.countries = new CountryRepository(db);
        this.languages = new LanguageRepository(db);

        /**
         * ========================================================
         * System
         * ========================================================
         */

        this.files = new FileRepository(db);
        this.users = new UserRepository(db);
        this.workflows = new WorkflowRepository(db);
        this.aiJobs = new AIJobRepository(db);

    }

    /**
     * ============================================================
     * Datenbank
     * ============================================================
     */

    getDatabase() {

        return this.db;

    }

    /**
     * ============================================================
     * Repository nach Name
     * ============================================================
     */

    get(name) {

        return this[name] ?? null;

    }

    /**
     * ============================================================
     * Prüfen
     * ============================================================
     */

    has(name) {

        return Object.prototype.hasOwnProperty.call(this, name);

    }

    /**
     * ============================================================
     * Repository-Liste
     * ============================================================
     */

    list() {

        return Object.keys(this)
            .filter(key => key !== 'db');

    }

    /**
     * ============================================================
     * Informationen
     * ============================================================
     */

    info() {

        return {

            repositories: this.list(),

            count: this.list().length

        };

    }

}

module.exports = RepositoryManager;