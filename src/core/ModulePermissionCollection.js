'use strict';

class ModulePermissionCollection {

    constructor() {

        this.items = [];

    }

    add(permission) {

        this.items.push(permission);

        return this;

    }

    remove(permission) {

        this.items = this.items.filter(

            item => item !== permission

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

module.exports = ModulePermissionCollection;