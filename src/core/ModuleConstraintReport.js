'use strict';

class ModuleConstraintReport {

    constructor(registry) {

        this.registry = registry;

        this.createdAt = new Date();

    }

    generate() {

        return this.registry
            .all()
            .map(item => item.toJSON());

    }

    toJSON() {

        return {

            createdAt: this.createdAt,
            total: this.registry.count(),
            constraints: this.generate()

        };

    }

}

module.exports = ModuleConstraintReport;