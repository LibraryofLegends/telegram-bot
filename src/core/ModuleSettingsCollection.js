'use strict';

class ModuleSettingsCollection {

    constructor() {

        this.items = [];

    }

    add(settings) {

        this.items.push(settings);

        return this;

    }

    remove(settings) {

        this.items = this.items.filter(

            item => item !== settings

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

module.exports = ModuleSettingsCollection;