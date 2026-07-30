'use strict';

class ModuleFlagSnapshot {

    constructor(flag) {

        this.createdAt = new Date();

        this.data = flag.toJSON();

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
            flag: this.data

        };

    }

}

module.exports = ModuleFlagSnapshot;