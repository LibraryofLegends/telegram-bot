'use strict';

class ModuleEnvironmentReport {

    constructor(registry) {

        this.registry = registry;

        this.createdAt = new Date();

    }

    generate() {

        return this.registry
            .all()
            .map(environment => environment.toJSON());

    }

    toJSON() {

        return {

            createdAt: this.createdAt,
            total: this.registry.count(),
            environments: this.generate()

        };

    }

}

module.exports = ModuleEnvironmentReport;