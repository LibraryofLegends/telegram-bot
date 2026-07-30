'use strict';

class ModuleFeatureReport {

    constructor(registry) {

        this.registry = registry;
        this.createdAt = new Date();

    }

    generate() {

        return this.registry
            .all()
            .map(feature => feature.toJSON());

    }

    toJSON() {

        return {

            createdAt: this.createdAt,
            total: this.registry.count(),
            features: this.generate()

        };

    }

}

module.exports = ModuleFeatureReport;