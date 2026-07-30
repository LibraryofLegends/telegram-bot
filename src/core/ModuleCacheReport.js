'use strict';

class ModuleCacheReport {

    constructor(registry) {

        this.registry = registry;

        this.createdAt = new Date();

    }

    generate() {

        return this.registry
            .all()
            .map(cache => cache.count());

    }

    toJSON() {

        return {

            createdAt: this.createdAt,
            total: this.registry.count(),
            caches: this.generate()

        };

    }

}

module.exports = ModuleCacheReport;