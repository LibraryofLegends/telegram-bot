'use strict';

class ModuleParameterSnapshot {

    constructor(parameter) {

        this.createdAt = new Date();

        this.data = parameter.toJSON();

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
            parameter: this.data

        };

    }

}

module.exports = ModuleParameterSnapshot;