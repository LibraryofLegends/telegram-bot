/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                     🚀 Library Of Legends Framework                     ║
 * ║                                  (LLF)                                 ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║ Framework    : Library Of Legends Framework                            ║
 * ║ Version      : 0.1.0                                                   ║
 * ║ Codename     : Foundation                                              ║
 * ║ Modul        : HTTP System                                             ║
 * ║ Paket        : 04                                                      ║
 * ║ Datei        : UploadedFile.js                                         ║
 * ║ Klasse       : UploadedFile                                            ║
 * ║ ID           : LLF-HTTP-0004                                           ║
 * ║ Datei-Version: 1.0.0                                                   ║
 * ║ Status       : Stable                                                  ║
 * ║ Autor        : Mr. Library Of Legends                                  ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

/**
 * Repräsentiert eine hochgeladene Datei.
 *
 * Diese Klasse kapselt sämtliche Informationen
 * einer Datei, die über einen HTTP-Request
 * hochgeladen wurde.
 */
export default class UploadedFile {

    /**
     * Ursprünglicher Dateiname.
     *
     * @type {string}
     */
    #name;

    /**
     * Temporärer Dateipfad.
     *
     * @type {string}
     */
    #path;

    /**
     * MIME-Type.
     *
     * @type {string}
     */
    #mimeType;

    /**
     * Dateigröße in Byte.
     *
     * @type {number}
     */
    #size;

    /**
     * Upload-Fehlercode.
     *
     * @type {number}
     */
    #error;

    /**
     * Erstellt eine UploadedFile.
     *
     * @param {Object} options
     * @param {string} options.name
     * @param {string} options.path
     * @param {string} options.mimeType
     * @param {number} options.size
     * @param {number} [options.error=0]
     */
    constructor({

        name,

        path,

        mimeType,

        size,

        error = 0

    }) {

        if (typeof name !== "string" || name.trim() === "") {

            throw new TypeError(
                "File name must be a non-empty string."
            );

        }

        if (typeof path !== "string" || path.trim() === "") {

            throw new TypeError(
                "File path must be a non-empty string."
            );

        }

        if (typeof mimeType !== "string") {

            throw new TypeError(
                "MIME type must be a string."
            );

        }

        if (!Number.isInteger(size) || size < 0) {

            throw new TypeError(
                "File size must be a non-negative integer."
            );

        }

        if (!Number.isInteger(error) || error < 0) {

            throw new TypeError(
                "Upload error must be a non-negative integer."
            );

        }

        this.#name = name.trim();
        this.#path = path.trim();
        this.#mimeType = mimeType.trim();
        this.#size = size;
        this.#error = error;

    }

    /**
     * Dateiname.
     *
     * @returns {string}
     */
    get name() {

        return this.#name;

    }

    /**
     * Dateipfad.
     *
     * @returns {string}
     */
    get path() {

        return this.#path;

    }

    /**
     * MIME-Type.
     *
     * @returns {string}
     */
    get mimeType() {

        return this.#mimeType;

    }

    /**
     * Dateigröße.
     *
     * @returns {number}
     */
    get size() {

        return this.#size;

    }

    /**
     * Upload-Fehlercode.
     *
     * @returns {number}
     */
    get error() {

        return this.#error;

    }

    /**
     * Prüft, ob der Upload erfolgreich war.
     *
     * @returns {boolean}
     */
    get isValid() {

        return this.#error === 0;

    }

    /**
     * Exportiert die Datei.
     *
     * @returns {Object}
     */
    toJSON() {

        return {

            name: this.#name,
            path: this.#path,
            mimeType: this.#mimeType,
            size: this.#size,
            error: this.#error

        };

    }

}