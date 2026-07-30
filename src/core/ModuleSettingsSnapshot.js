'use strict';

class ModuleSettingsSnapshot {

    constructor(settings) {

        this.createdAt = new Date();

        this.values = settings.all();

    }

    getCreatedAt() {

        return this.createdAt;

    }

    getValues() {

        return {

            ...this.values

        };

    }

    toJSON() {

        return {

            createdAt: this.createdAt,

            values: this.values

        };

    }

}

module.exports = ModuleSettingsSnapshot;