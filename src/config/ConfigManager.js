'use strict';

const fs = require('fs');
const path = require('path');

class ConfigManager {

    constructor(configFile = null) {

        this.configFile =
            configFile ??
            path.join(
                process.cwd(),
                'config.json'
            );

        this.config = {};

        this.load();

    }

    /**
     * Konfiguration laden.
     */
    load() {

        if (

            fs.existsSync(this.configFile)

        ) {

            this.config = JSON.parse(

                fs.readFileSync(

                    this.configFile,

                    'utf8'

                )

            );

        }

    }

    /**
     * Konfiguration speichern.
     */
    save() {

        fs.writeFileSync(

            this.configFile,

            JSON.stringify(

                this.config,

                null,

                4

            )

        );

    }

    /**
     * Wert lesen.
     */
    get(

        key,

        defaultValue = null

    ) {

        const parts = key.split('.');

        let current = this.config;

        for (const part of parts) {

            if (

                current?.[part] === undefined

            ) {

                return defaultValue;

            }

            current = current[part];

        }

        return current;

    }

    /**
     * Wert setzen.
     */
    set(

        key,

        value

    ) {

        const parts = key.split('.');

        let current = this.config;

        while (

            parts.length > 1

        ) {

            const part = parts.shift();

            if (!current[part]) {

                current[part] = {};

            }

            current = current[part];

        }

        current[parts[0]] = value;

    }

    /**
     * Existiert?
     */
    has(key) {

        return this.get(

            key,

            undefined

        ) !== undefined;

    }

    /**
     * Löschen.
     */
    remove(key) {

        const parts = key.split('.');

        let current = this.config;

        while (

            parts.length > 1

        ) {

            current = current[parts.shift()];

            if (!current) {

                return;

            }

        }

        delete current[parts[0]];

    }

    /**
     * Standardwerte.
     */
    loadDefaults() {

        this.config = {

            database: {

                file: "library.db"

            },

            tmdb: {

                apiKey: "",

                language: "de-DE"

            },

            omdb: {

                apiKey: ""

            },

            telegram: {

                token: "",

                chatId: ""

            },

            importer: {

                watchFolders: [],

                autoImport: true

            },

            artwork: {

                download: true,

                overwrite: false

            },

            thumbnails: {

                enabled: true,

                count: 5

            },

            cache: {

                enabled: true,

                ttl: 3600

            },

            logging: {

                level: "info"

            }

        };

    }

}

module.exports = ConfigManager;