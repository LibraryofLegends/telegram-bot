'use strict';

class ModuleConfigReport {

    constructor(registry) {

        this.registry = registry;

        this.createdAt = new Date();

    }

    generate() {

        return this.registry

            .all()

            .map(

                config => config.all()

            );

    }

    toJSON() {

        return {

            createdAt: this.createdAt,

            total: this.registry.count(),

            configs: this.generate()

        };

    }

}

module.exports = ModuleConfigReport;