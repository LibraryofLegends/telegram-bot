'use strict';

class ModuleProfileReport {

    constructor(registry) {

        this.registry = registry;

        this.createdAt = new Date();

    }

    generate() {

        return this.registry
            .all()
            .map(profile => profile.toJSON());

    }

    toJSON() {

        return {

            createdAt: this.createdAt,
            total: this.registry.count(),
            profiles: this.generate()

        };

    }

}

module.exports = ModuleProfileReport;