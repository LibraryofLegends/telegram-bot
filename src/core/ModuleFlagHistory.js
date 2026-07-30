'use strict';

class ModuleFlagHistory {

    constructor() {

        this.history = [];

    }

    add(name, enabled) {

        this.history.push({

            name,
            enabled,
            timestamp: new Date()

        });

        return this;

    }

    latest() {

        return this.history.at(-1) || null;

    }

    first() {

        return this.history[0] || null;

    }

    all() {

        return [...this.history];

    }

    clear() {

        this.history = [];

    }

    count() {

        return this.history.length;

    }

}

module.exports = ModuleFlagHistory;