'use strict';

class ModuleContextReport {

    constructor(registry) {

        this.registry = registry;

        this.createdAt = new Date();

    }

    generate() {

        return this.registry

            .all()

            .map(

                context => context.all()

            );

    }

    toJSON() {

        return {

            createdAt: this.createdAt,

            total: this.registry.count(),

            contexts: this.generate()

        };

    }

}

module.exports = ModuleContextReport;