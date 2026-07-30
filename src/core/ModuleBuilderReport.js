'use strict';

class ModuleBuilderReport {

    constructor(registry) {

        this.registry = registry;

        this.createdAt = new Date();

    }

    generate() {

        return this.registry
            .all()
            .map(builder => builder.count());

    }

    toJSON() {

        return {

            createdAt: this.createdAt,
            total: this.registry.count(),
            builders: this.generate()

        };

    }

}

module.exports = ModuleBuilderReport;