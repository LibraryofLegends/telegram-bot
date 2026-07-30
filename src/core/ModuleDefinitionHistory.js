'use strict';

class ModuleDefinitionHistory {

    constructor() {

        this.history = [];

    }

    add(definition) {

        this.history.push({

            definition,

            timestamp: new Date()

        });

        return this;

    }

    latest() {

        return this.history.at(-1) || null;

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

module.exports = ModuleDefinitionHistory;