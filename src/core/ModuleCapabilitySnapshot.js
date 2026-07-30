'use strict';

class ModuleCapabilitySnapshot {

    constructor(capability) {

        this.createdAt = new Date();

        this.data = capability.toJSON();

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
            capability: this.data

        };

    }

}

module.exports = ModuleCapabilitySnapshot;