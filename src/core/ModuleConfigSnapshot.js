'use strict';

class ModuleConfigSnapshot {

    constructor(config) {

        this.createdAt = new Date();

        this.values = config.all();

    }

    getCreatedAt() {

        return this.createdAt;

    }

    getValues() {

        return {

            ...this.values

        };

    }

    toJSON() {

        return {

            createdAt: this.createdAt,

            values: this.values

        };

    }

}

module.exports = ModuleConfigSnapshot;