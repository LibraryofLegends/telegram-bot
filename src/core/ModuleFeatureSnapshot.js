'use strict';

class ModuleFeatureSnapshot {

    constructor(feature) {

        this.createdAt = new Date();
        this.data = feature.toJSON();

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
            feature: this.data

        };

    }

}

module.exports = ModuleFeatureSnapshot;