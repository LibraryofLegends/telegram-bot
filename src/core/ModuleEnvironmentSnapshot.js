'use strict';

class ModuleEnvironmentSnapshot {

    constructor(environment) {

        this.createdAt = new Date();

        this.data = environment.toJSON();

    }

    getCreatedAt() {

        return this.createdAt;

    }

    getData() {

        return this.data;

    }

    toJSON() {

        return {

            createdAt: this.createdAt,
            environment: this.data

        };

    }

}

module.exports = ModuleEnvironmentSnapshot;