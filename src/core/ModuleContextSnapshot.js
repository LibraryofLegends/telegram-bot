'use strict';

class ModuleContextSnapshot {

    constructor(context) {

        this.createdAt = new Date();

        this.data = context.all();

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

            context: this.data

        };

    }

}

module.exports = ModuleContextSnapshot;