'use strict';

class ModuleStatusHistory {

    constructor() {

        this.history = [];

    }

    push(module, status) {

        this.history.push({

            module,

            status,

            timestamp: new Date()

        });

        return this;

    }

    all() {

        return [...this.history];

    }

    latest() {

        return this.history.length

            ? this.history[this.history.length - 1]

            : null;

    }

    count() {

        return this.history.length;

    }

    clear() {

        this.history.length = 0;

    }

    toJSON() {

        return this.all();

    }

}

module.exports = ModuleStatusHistory;