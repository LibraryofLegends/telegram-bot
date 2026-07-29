'use strict';

const fs = require('fs').promises;
const path = require('path');

class LibraryScanner {

    constructor(importQueue, options = {}) {

        this.importQueue = importQueue;

        this.recursive =
            options.recursive ?? true;

        this.supportedExtensions = (

            options.supportedExtensions ?? [

                '.mkv',
                '.mp4',
                '.avi',
                '.mov',
                '.wmv',
                '.m4v',
                '.ts',
                '.m2ts',
                '.webm'

            ]

        ).map(ext => ext.toLowerCase());

        this.stats = {

            scannedFolders: 0,
            scannedFiles: 0,
            importedFiles: 0,
            skippedFiles: 0

        };

    }

    /**
     * Bibliothek scannen.
     *
     * @param {String} directory
     */
    async scan(directory) {

        this.resetStats();

        await this.scanDirectory(directory);

        return this.stats;

    }

    /**
     * Ordner durchsuchen.
     *
     * @param {String} directory
     */
    async scanDirectory(directory) {

        this.stats.scannedFolders++;

        const entries =
            await fs.readdir(directory, {

                withFileTypes: true

            });

        for (const entry of entries) {

            const fullPath =
                path.join(directory, entry.name);

            if (entry.isDirectory()) {

                if (this.recursive) {

                    await this.scanDirectory(fullPath);

                }

                continue;

            }

            await this.handleFile(fullPath);

        }

    }

    /**
     * Datei verarbeiten.
     *
     * @param {String} file
     */
    async handleFile(file) {

        this.stats.scannedFiles++;

        const extension =
            path.extname(file).toLowerCase();

        if (

            !this.supportedExtensions.includes(
                extension
            )

        ) {

            this.stats.skippedFiles++;

            return;

        }

        this.importQueue.add(file);

        this.stats.importedFiles++;

    }

    /**
     * Statistik zurücksetzen.
     */
    resetStats() {

        this.stats = {

            scannedFolders: 0,
            scannedFiles: 0,
            importedFiles: 0,
            skippedFiles: 0

        };

    }

    /**
     * Unterstützte Erweiterung?
     *
     * @param {String} file
     */
    isSupported(file) {

        return this.supportedExtensions.includes(

            path.extname(file).toLowerCase()

        );

    }

    /**
     * Statistik abrufen.
     */
    getStats() {

        return {

            ...this.stats

        };

    }

}

module.exports = LibraryScanner;