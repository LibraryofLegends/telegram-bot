'use strict';

class ModulePolicyReport {

    constructor(registry) {

        this.registry = registry;

        this.createdAt = new Date();

    }

    generate() {

        return this.registry
            .all()
            .map(policy => policy.toJSON());

    }

    toJSON() {

        return {

            createdAt: this.createdAt,
            total: this.registry.count(),
            policies: this.generate()

        };

    }

}

module.exports = ModulePolicyReport;