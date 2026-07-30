'use strict';

class ModuleOptionSnapshot {

    constructor(option) {

        this.createdAt = new Date();

        this.data = option.toJSON();

    }

    getData() {

        return this.data;

    }

    getCreatedAt() {

        return this.createdAt;

    }

    toJSON() {

        return {

            createdAt: this.createdAt,
            option: this.data

        };

    }

}

module.exports = ModuleOptionSnapshot;