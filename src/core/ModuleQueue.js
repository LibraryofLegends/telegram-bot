'use strict';

class ModuleQueue {

    constructor() {

        this.items = [];

    }

    enqueue(item) {

        this.items.push(item);

        return this;

    }

    dequeue() {

        return this.items.shift() || null;

    }

    peek() {

        return this.items[0] || null;

    }

    isEmpty() {

        return this.items.length === 0;

    }

    clear() {

        this.items = [];

    }

    all() {

        return [...this.items];

    }

    count() {

        return this.items.length;

    }

}

module.exports = ModuleQueue;