'use strict';

class IdentityMap {

    constructor() {

        this.entities = new Map();

    }

    key(type, id) {

        return `${type}:${id}`;

    }

    has(type, id) {

        return this.entities.has(

            this.key(type, id)

        );

    }

    get(type, id) {

        return this.entities.get(

            this.key(type, id)

        );

    }

    add(type, id, entity) {

        this.entities.set(

            this.key(type, id),

            entity

        );

        return entity;

    }

    remove(type, id) {

        this.entities.delete(

            this.key(type, id)

        );

    }

    clear() {

        this.entities.clear();

    }

}

module.exports = IdentityMap;