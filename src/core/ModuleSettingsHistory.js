'use strict';

class ModuleSettingsHistory {

    constructor() {

        this.entries = [];

    }

    add(key, value) {

        this.entries.push({

            key,

            value,

            timestamp: new Date()

        });

        return this;

    }

    latest() {

        return this.entries.at(-1) || null;

    }

    first() {

        return this.entries[0] || null;

    }

    all() {

        return [...this.entries];

    }

    clear() {

        this.entries = [];

    }

    count() {

        return this.entries.length;

    }

}

module.exports = ModuleSettingsHistory;