'use strict';

class ModuleParameterReport {

    constructor(registry) {

        this.registry = registry;

        this.createdAt = new Date();

    }

    generate() {

        return this.registry

            .all()

            .map(

                parameter => parameter.toJSON()

            );

    }

    toJSON() {

        return {

            createdAt: this.createdAt,

            total: this.registry.count(),

            parameters: this.generate()

        };

    }

}

module.exports = ModuleParameterReport;