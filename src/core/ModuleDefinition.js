'use strict';

class ModuleDefinition {

    constructor(name) {

        this.name = name;
        this.definition = {};

    }

    getName() {

        return this.name;

    }

    set(key, value) {

        this.definition[key] = value;

        return this;

    }

    get(key, defaultValue = null) {

        return Object.prototype.hasOwnProperty.call(this.definition, key)

            ? this.definition[key]

            : defaultValue;

    }

    has(key) {

        return Object.prototype.hasOwnProperty.call(

            this.definition,

            key

        );

    }

    remove(key) {

        delete this.definition[key];

        return this;

    }

    clear() {

        this.definition = {};

    }

    all() {

        return {

            ...this.definition

        };

    }

}

module.exports = ModuleDefinition;