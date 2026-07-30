'use strict';

class ModuleEventStatistics {

    constructor(history) {

        this.history = history;

    }

    total() {

        return this.history.count();

    }

    byName(name) {

        return this.history

            .all()

            .filter(

                event => event.name === name

            )

            .length;

    }

    summary() {

        return {

            total: this.total()

        };

    }

    toJSON() {

        return this.summary();

    }

}

module.exports = ModuleEventStatistics;