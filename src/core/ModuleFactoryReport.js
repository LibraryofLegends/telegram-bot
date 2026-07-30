'use strict';

class ModuleFactoryReport {

    constructor(registry) {

        this.registry = registry;

        this.createdAt = new Date();

    }

    generate() {

        return this.registry
            .all()
            .map(factory => factory.count());

    }

    toJSON() {

        return {

            createdAt: this.createdAt,
            total: this.registry.count(),
            factories: this.generate()

        };

    }

}

module.exports = ModuleFactoryReport;