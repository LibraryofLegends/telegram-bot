'use strict';

class ModuleRepositoryReport {

    constructor(registry) {

        this.registry = registry;

        this.createdAt = new Date();

    }

    generate() {

        return this.registry
            .all()
            .map(repository => repository.count());

    }

    toJSON() {

        return {

            createdAt: this.createdAt,
            total: this.registry.count(),
            repositories: this.generate()

        };

    }

}

module.exports = ModuleRepositoryReport;