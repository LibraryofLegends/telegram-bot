'use strict';

class ModuleEventHistory {

    constructor() {

        this.history = [];

    }

    push(name, payload = {}) {

        this.history.push({

            name,

            payload,

            timestamp: new Date()

        });

        return this;

    }

    latest() {

        return this.history.length

            ? this.history[this.history.length - 1]

            : null;

    }

    first() {

        return this.history.length

            ? this.history[0]

            : null;

    }

    all() {

        return [...this.history];

    }

    count() {

        return this.history.length;

    }

    clear() {

        this.history.length = 0;

    }

}

module.exports = ModuleEventHistory;