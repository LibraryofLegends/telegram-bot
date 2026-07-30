'use strict';

class ModuleEventCollection {

    constructor() {

        this.events = [];

    }

    add(event) {

        this.events.push(event);

        return this;

    }

    remove(event) {

        this.events = this.events.filter(

            item => item !== event

        );

        return this;

    }

    first() {

        return this.events[0] || null;

    }

    last() {

        return this.events.length

            ? this.events[this.events.length - 1]

            : null;

    }

    all() {

        return [...this.events];

    }

    count() {

        return this.events.length;

    }

    clear() {

        this.events.length = 0;

    }

}

module.exports = ModuleEventCollection;