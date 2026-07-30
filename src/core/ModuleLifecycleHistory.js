'use strict';

class ModuleLifecycleHistory {

    constructor() {

        this.entries = [];

    }

    add(module, phase) {

        this.entries.push({

            module,
            phase,
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

module.exports = ModuleLifecycleHistory;