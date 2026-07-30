'use strict';

class ModulePipelineHistory {

    constructor() {

        this.history = [];

    }

    add(stepCount) {

        this.history.push({

            stepCount,
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

module.exports = ModulePipelineHistory;