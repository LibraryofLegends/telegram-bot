'use strict';

class ModuleLifecycle {

    constructor(module) {

        this.module = module;
        this.phase = 'created';
        this.history = [];

    }

    enter(phase) {

        this.phase = phase;

        this.history.push({

            phase,
            timestamp: new Date()

        });

        return this;

    }

    current() {

        return this.phase;

    }

    previous() {

        if (this.history.length < 2) {

            return null;

        }

        return this.history[
            this.history.length - 2
        ];

    }

    timeline() {

        return [...this.history];

    }

    count() {

        return this.history.length;

    }

    clear() {

        this.history = [];

    }

}

module.exports = ModuleLifecycle;