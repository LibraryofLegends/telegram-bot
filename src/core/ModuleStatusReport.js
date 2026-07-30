'use strict';

class ModuleStatusReport {

    constructor(registry) {

        this.registry = registry;
        this.createdAt = new Date();

    }

    generate() {

        return this.registry

            .all()

            .map(([name, status]) => ({

                name,

                status

            }));

    }

    count() {

        return this.registry.count();

    }

    created() {

        return this.createdAt;

    }

    toJSON() {

        return {

            createdAt: this.createdAt,

            total: this.count(),

            modules: this.generate()

        };

    }

}

module.exports = ModuleStatusReport;