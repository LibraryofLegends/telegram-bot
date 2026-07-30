══════════════════════════════════════════════════════════════
🚀 LIBRARY OF LEGENDS FRAMEWORK (LLF)
══════════════════════════════════════════════════════════════

Version        : v0.1.0
Codename       : Foundation
Phase          : 1 – Core Foundation
Sprint         : 1
Modul          : Core
Paket          : 1
Status         : 🔄 In Entwicklung

Autor          : Thomas Lorenz
Projekt        : Library Of Legends Framework

══════════════════════════════════════════════════════════════

/**
 * Library Of Legends Framework (LLF)
 * Version: v0.1.0
 * Phase: Core Foundation
 */

export default class Version {

    static MAJOR = 0;

    static MINOR = 1;

    static PATCH = 0;

    static CODENAME = 'Foundation';

    static NAME = 'Library Of Legends Framework';

    static SHORT_NAME = 'LLF';

    static get version() {

        return `${this.MAJOR}.${this.MINOR}.${this.PATCH}`;

    }

    static get fullVersion() {

        return `v${this.version}`;

    }

    static get framework() {

        return `${this.NAME} ${this.fullVersion}`;

    }

    static toJSON() {

        return {

            name: this.NAME,
            shortName: this.SHORT_NAME,
            version: this.version,
            fullVersion: this.fullVersion,
            codename: this.CODENAME

        };

    }

}