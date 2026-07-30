'use strict';

class ModuleQueueHistory {

    constructor() {

        this.history = [];

    }

    add(count) {

        this.history.push({

            count,
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

module.exports = ModuleQueueHistory;