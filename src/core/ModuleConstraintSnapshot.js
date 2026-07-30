'use strict';

class ModuleConstraintSnapshot {

    constructor(constraint) {

        this.createdAt = new Date();

        this.data = constraint.toJSON();

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
            constraint: this.data

        };

    }

}

module.exports = ModuleConstraintSnapshot;