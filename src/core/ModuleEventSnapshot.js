'use strict';

class ModuleEventSnapshot {

    constructor(event) {

        this.createdAt = new Date();

        this.data = event.toJSON();

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

            event: this.data

        };

    }

}

module.exports = ModuleEventSnapshot;