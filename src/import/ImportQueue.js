'use strict';

const EventEmitter = require('events');

class ImportQueue extends EventEmitter {

    constructor(importEngine, options = {}) {

        super();

        this.importEngine = importEngine;

        this.queue = [];

        this.running = 0;

        this.maxParallel =
            options.maxParallel ?? 2;

        this.isProcessing = false;

        this.stats = {

            queued: 0,
            processed: 0,
            failed: 0

        };

    }

    /**
     * Datei zur Warteschlange hinzufügen.
     *
     * @param {String} filePath
     */
    add(filePath) {

        this.queue.push(filePath);

        this.stats.queued++;

        this.emit('queued', filePath);

        this.process();

    }

    /**
     * Mehrere Dateien hinzufügen.
     *
     * @param {Array<String>} files
     */
    addMany(files) {

        for (const file of files) {

            this.add(file);

        }

    }

    /**
     * Verarbeitung starten.
     */
    async process() {

        if (this.isProcessing) {
            return;
        }

        this.isProcessing = true;

        while (
            this.queue.length > 0 ||
            this.running > 0
        ) {

            while (

                this.running < this.maxParallel &&
                this.queue.length > 0

            ) {

                const file = this.queue.shift();

                this.running++;

                this.processFile(file);

            }

            await this.sleep(100);

        }

        this.isProcessing = false;

        this.emit('finished', this.stats);

    }

    /**
     * Einzelne Datei importieren.
     *
     * @param {String} file
     */
    async processFile(file) {

        try {

            this.emit('started', file);

            const media =
                await this.importEngine.import(file);

            this.stats.processed++;

            this.emit('success', media);

        } catch (err) {

            this.stats.failed++;

            this.emit('error', {

                file,

                error: err

            });

        } finally {

            this.running--;

        }

    }

    /**
     * Queue leeren.
     */
    clear() {

        this.queue = [];

    }

    /**
     * Queue-Größe.
     */
    size() {

        return this.queue.length;

    }

    /**
     * Läuft gerade?
     */
    busy() {

        return this.isProcessing;

    }

    /**
     * Statistik.
     */
    getStats() {

        return {

            ...this.stats,

            remaining: this.queue.length,

            running: this.running

        };

    }

    /**
     * Sleep.
     */
    sleep(ms) {

        return new Promise(resolve => {

            setTimeout(resolve, ms);

        });

    }

}

module.exports = ImportQueue;