'use strict';

class ModulePolicySnapshot {

    constructor(policy) {

        this.createdAt = new Date();

        this.data = policy.toJSON();

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
            policy: this.data

        };

    }

}

module.exports = ModulePolicySnapshot;