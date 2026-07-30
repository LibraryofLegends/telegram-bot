'use strict';

class ModuleResolverReport {

    constructor(registry) {

        this.registry = registry;

        this.createdAt = new Date();

    }

    generate() {

        return this.registry
            .all()
            .map(resolver => resolver.count());

    }

    toJSON() {

        return {

            createdAt: this.createdAt,
            total: this.registry.count(),
            resolvers: this.generate()

        };

    }

}

module.exports = ModuleResolverReport;