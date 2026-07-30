'use strict';

class ModuleEventMonitor {

    constructor(history) {

        this.history = history;

        this.lastCheck = null;

    }

    check() {

        this.lastCheck = new Date();

        return {

            checkedAt: this.lastCheck,

            events: this.history.count()

        };

    }

    getLastCheck() {

        return this.lastCheck;

    }

    toJSON() {

        return this.check();

    }

}

module.exports = ModuleEventMonitor;