'use strict';

class ModulePermissionReport {

    constructor(registry) {

        this.registry = registry;

        this.createdAt = new Date();

    }

    generate() {

        return this.registry
            .all()
            .map(permission => permission.toJSON());

    }

    toJSON() {

        return {

            createdAt: this.createdAt,
            total: this.registry.count(),
            permissions: this.generate()

        };

    }

}

module.exports = ModulePermissionReport;