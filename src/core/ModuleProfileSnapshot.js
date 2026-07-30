'use strict';

class ModuleProfileSnapshot {

    constructor(profile) {

        this.createdAt = new Date();

        this.data = profile.toJSON();

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
            profile: this.data

        };

    }

}

module.exports = ModuleProfileSnapshot;