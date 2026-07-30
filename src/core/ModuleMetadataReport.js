'use strict';

class ModuleMetadataReport {

    constructor(registry) {

        this.registry = registry;

        this.createdAt = new Date();

    }

    generate() {

        return this.registry

            .all()

            .map(

                metadata => metadata.entries()

            );

    }

    toJSON() {

        return {

            createdAt: this.createdAt,

            total: this.registry.count(),

            metadata: this.generate()

        };

    }

}

module.exports = ModuleMetadataReport;