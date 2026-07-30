'use strict';

class ModuleDefinitionReport {

    constructor(registry) {

        this.registry = registry;

        this.createdAt = new Date();

    }

    generate() {

        return this.registry
            .all()
            .map(

                definition => definition.all()

            );

    }

    toJSON() {

        return {

            createdAt: this.createdAt,

            total: this.registry.count(),

            definitions: this.generate()

        };

    }

}

module.exports = ModuleDefinitionReport;