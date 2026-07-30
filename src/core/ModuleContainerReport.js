'use strict';

class ModuleContainerReport {

    constructor(registry) {

        this.registry = registry;

        this.createdAt = new Date();

    }

    generate() {

        return this.registry
            .all()
            .map(container => container.count());

    }

    toJSON() {

        return {

            createdAt: this.createdAt,
            total: this.registry.count(),
            containers: this.generate()

        };

    }

}

module.exports = ModuleContainerReport;