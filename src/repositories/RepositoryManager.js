/**
 * ========================================================================
 * Library Of Legends 2.0
 * ------------------------------------------------------------------------
 * Datei:
 * src/repositories/RepositoryManager.js
 * ------------------------------------------------------------------------
 * Beschreibung:
 *
 * Zentrale Verwaltung aller Repository-Klassen.
 *
 * Erstellt sämtliche Repository-Instanzen und stellt sie
 * zentral innerhalb der Anwendung zur Verfügung.
 *
 * Funktionen:
 * - Initialisierung aller Repositories
 * - Zentrale Verwaltung
 * - Dynamisches Registrieren
 * - Repository-Lookup
 * - Repository-Informationen
 * - Reset aller Repositories
 *
 * Version:
 * 2.0.0
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

        if (!db) {

            throw new Error('RepositoryManager benötigt eine Datenbankinstanz.');

        }

        this.db = db;

        this.repositories = {};

        this.initialize();

    }

    /**
     * ============================================================
     * Initialisierung
     * ============================================================
     */

    initialize() {

        /**
         * --------------------------------------------------------
         * Medien
         * --------------------------------------------------------
         */

        this.register('movies', new MovieRepository(this.db));
        this.register('series', new SeriesRepository(this.db));
        this.register('seasons', new SeasonRepository(this.db));
        this.register('episodes', new EpisodeRepository(this.db));

        /**
         * --------------------------------------------------------
         * Stammdaten
         * --------------------------------------------------------
         */

        this.register('people', new PersonRepository(this.db));
        this.register('genres', new GenreRepository(this.db));
        this.register('collections', new CollectionRepository(this.db));
        this.register('studios', new StudioRepository(this.db));
        this.register('companies', new CompanyRepository(this.db));
        this.register('countries', new CountryRepository(this.db));
        this.register('languages', new LanguageRepository(this.db));

        /**
         * --------------------------------------------------------
         * System
         * --------------------------------------------------------
         */

        this.register('files', new FileRepository(this.db));
        this.register('users', new UserRepository(this.db));
        this.register('workflows', new WorkflowRepository(this.db));
        this.register('aiJobs', new AIJobRepository(this.db));

    }

    /**
     * ============================================================
     * Registrierung
     * ============================================================
     */

    register(name, repository) {

        if (typeof name !== 'string' || !name.trim()) {

            throw new Error('Ungültiger Repository-Name.');

        }

        if (!repository) {

            throw new Error(`Repository "${name}" ist ungültig.`);

        }

        this.repositories[name] = repository;

        this[name] = repository;

        return this;

    }

    /**
     * ============================================================
     * Repository abrufen
     * ============================================================
     */

    get(name) {

        return this.repositories[name] ?? null;

    }

    /**
     * ============================================================
     * Repository vorhanden?
     * ============================================================
     */

    has(name) {

        return Object.prototype.hasOwnProperty.call(
            this.repositories,
            name
        );

    }

    /**
     * ============================================================
     * Repository entfernen
     * ============================================================
     */

    remove(name) {

        if (!this.has(name)) {

            return false;

        }

        delete this.repositories[name];

        delete this[name];

        return true;

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
     * Alle Repository-Namen
     * ============================================================
     */

    list() {

        return Object.keys(this.repositories).sort();

    }

    /**
     * ============================================================
     * Alle Repository-Objekte
     * ============================================================
     */

    all() {

        return Object.values(this.repositories);

    }

    /**
     * ============================================================
     * Anzahl
     * ============================================================
     */

    count() {

        return this.list().length;

    }

    /**
     * ============================================================
     * Alle Repositories zurücksetzen
     * ============================================================
     */

    reset() {

        for (const repository of this.all()) {

            if (typeof repository.reset === 'function') {

                repository.reset();

            }

        }

        return this;

    }

    /**
     * ============================================================
     * Repository-Informationen
     * ============================================================
     */

    info() {

        return {

            repositories: this.list(),

            count: this.count(),

            database: !!this.db,

            repositoryInfo: this.all().map(repository => {

                if (typeof repository.toJSON === 'function') {

                    return repository.toJSON();

                }

                return {

                    repository: repository.constructor.name

                };

            })

        };

    }

    /**
     * ============================================================
     * JSON
     * ============================================================
     */

    toJSON() {

        return this.info();

    }

}

module.exports = RepositoryManager;