'use strict';

class ModuleConfigHistory {

    constructor() {

        this.entries = [];

    }

    push(key, value) {

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

module.exports = ModuleConfigHistory;