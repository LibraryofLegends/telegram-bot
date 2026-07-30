'use strict';

class ModuleOptionReport {

    constructor(registry) {

        this.registry = registry;

        this.createdAt = new Date();

    }

    generate() {

        return this.registry

            .all()

            .map(

                option => option.toJSON()

            );

    }

    toJSON() {

        return {

            createdAt: this.createdAt,

            total: this.registry.count(),

            options: this.generate()

        };

    }

}

module.exports = ModuleOptionReport;