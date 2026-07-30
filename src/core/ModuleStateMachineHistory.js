'use strict';

class ModuleStateMachineHistory {

    constructor() {

        this.history = [];

    }

    add(state) {

        this.history.push({

            state,

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

module.exports = ModuleStateMachineHistory;