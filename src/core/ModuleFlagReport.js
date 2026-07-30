'use strict';

class ModuleFlagReport {

    constructor(registry) {

        this.registry = registry;

        this.createdAt = new Date();

    }

    generate() {

        return this.registry
            .all()
            .map(flag => flag.toJSON());

    }

    toJSON() {

        return {

            createdAt: this.createdAt,
            total: this.registry.count(),
            flags: this.generate()

        };

    }

}

module.exports = ModuleFlagReport;