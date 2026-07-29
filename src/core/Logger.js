/**
 * ========================================================================
 * Library Of Legends 2.0
 * ------------------------------------------------------------------------
 * Datei:
 * src/core/Logger.js
 * ------------------------------------------------------------------------
 * Beschreibung:
 *
 * Zentraler Logger der Anwendung.
 *
 * Version:
 * 1.0.0
 * ========================================================================
 */

'use strict';

const LogLevel = require('./LogLevel');

class Logger {

    /**
     * ============================================================
     * Konstruktor
     * ============================================================
     */

    constructor({

        level = LogLevel.INFO,

        writer = console,

        formatter = null

    } = {}) {

        this.level = level;

        this.writer = writer;

        this.formatter = formatter;

    }

    /**
     * ============================================================
     * Schreiben
     * ============================================================
     */

    log(level, module, message, meta = {}) {

        if (level < this.level) {

            return;

        }

        const entry = {

            timestamp: new Date(),

            level,

            module,

            message,

            meta

        };

        if (this.formatter) {

            this.writer.log(

                this.formatter.format(entry)

            );

            return;

        }

        this.writer.log(entry);

    }

    /**
     * ============================================================
     * TRACE
     * ============================================================
     */

    trace(module, message, meta = {}) {

        this.log(LogLevel.TRACE, module, message, meta);

    }

    /**
     * ============================================================
     * DEBUG
     * ============================================================
     */

    debug(module, message, meta = {}) {

        this.log(LogLevel.DEBUG, module, message, meta);

    }

    /**
     * ============================================================
     * INFO
     * ============================================================
     */

    info(module, message, meta = {}) {

        this.log(LogLevel.INFO, module, message, meta);

    }

    /**
     * ============================================================
     * WARN
     * ============================================================
     */

    warn(module, message, meta = {}) {

        this.log(LogLevel.WARN, module, message, meta);

    }

    /**
     * ============================================================
     * ERROR
     * ============================================================
     */

    error(module, message, meta = {}) {

        this.log(LogLevel.ERROR, module, message, meta);

    }

    /**
     * ============================================================
     * FATAL
     * ============================================================
     */

    fatal(module, message, meta = {}) {

        this.log(LogLevel.FATAL, module, message, meta);

    }

}

module.exports = Logger;