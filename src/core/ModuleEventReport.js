'use strict';

class ModuleEventReport {

    constructor(history) {

        this.history = history;

        this.createdAt = new Date();

    }

    generate() {

        return this.history.all();

    }

    toJSON() {

        return {

            createdAt: this.createdAt,

            total: this.history.count(),

            events: this.generate()

        };

    }

}

module.exports = ModuleEventReport;