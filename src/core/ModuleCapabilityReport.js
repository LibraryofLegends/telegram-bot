'use strict';

class ModuleCapabilityReport {

    constructor(registry) {

        this.registry = registry;

        this.createdAt = new Date();

    }

    generate() {

        return this.registry

            .all()

            .map(

                capability => capability.toJSON()

            );

    }

    toJSON() {

        return {

            createdAt: this.createdAt,
            total: this.registry.count(),
            capabilities: this.generate()

        };

    }

}

module.exports = ModuleCapabilityReport;