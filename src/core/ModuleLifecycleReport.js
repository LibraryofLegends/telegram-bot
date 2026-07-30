'use strict';

class ModuleLifecycleReport {

    constructor(registry) {

        this.registry = registry;

        this.createdAt = new Date();

    }

    generate() {

        return this.registry

            .all()

            .map(

                lifecycle => lifecycle.current()

            );

    }

    toJSON() {

        return {

            createdAt: this.createdAt,

            total: this.registry.count(),

            phases: this.generate()

        };

    }

}

module.exports = ModuleLifecycleReport;