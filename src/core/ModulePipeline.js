'use strict';

class ModulePipeline {

    constructor() {

        this.steps = [];

    }

    add(step) {

        this.steps.push(step);

        return this;

    }

    remove(step) {

        this.steps = this.steps.filter(

            item => item !== step

        );

        return this;

    }

    execute(payload) {

        let result = payload;

        for (const step of this.steps) {

            result = step(result);

        }

        return result;

    }

    all() {

        return [...this.steps];

    }

    clear() {

        this.steps = [];

    }

    count() {

        return this.steps.length;

    }

}

module.exports = ModulePipeline;