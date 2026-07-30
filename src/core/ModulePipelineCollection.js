'use strict';

class ModulePipelineCollection {

    constructor() {

        this.items = [];

    }

    add(pipeline) {

        this.items.push(pipeline);

        return this;

    }

    remove(pipeline) {

        this.items = this.items.filter(

            item => item !== pipeline

        );

        return this;

    }

    first() {

        return this.items[0] || null;

    }

    last() {

        return this.items.at(-1) || null;

    }

    all() {

        return [...this.items];

    }

    clear() {

        this.items = [];

    }

    count() {

        return this.items.length;

    }

}

module.exports = ModulePipelineCollection;