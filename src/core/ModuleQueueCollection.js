'use strict';

class ModuleQueueCollection {

    constructor() {

        this.items = [];

    }

    add(queue) {

        this.items.push(queue);

        return this;

    }

    remove(queue) {

        this.items = this.items.filter(

            item => item !== queue

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

module.exports = ModuleQueueCollection;