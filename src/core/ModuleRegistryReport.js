'use strict';

class ModuleRegistryReport {

    constructor(registry) {

        this.registry = registry;

        this.createdAt = new Date();

    }

    generate() {

        return this.registry
            .all()
            .map(module => module.getName());

    }

    toJSON() {

        return {

            createdAt: this.createdAt,
            total: this.registry.count(),
            modules: this.generate()

        };

    }

}

module.exports = ModuleRegistryReport;