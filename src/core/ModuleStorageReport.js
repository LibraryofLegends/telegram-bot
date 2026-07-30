'use strict';

class ModuleStorageReport {

    constructor(registry) {

        this.registry = registry;

        this.createdAt = new Date();

    }

    generate() {

        return this.registry
            .all()
            .map(storage => storage.count());

    }

    toJSON() {

        return {

            createdAt: this.createdAt,
            total: this.registry.count(),
            storages: this.generate()

        };

    }

}

module.exports = ModuleStorageReport;