'use strict';

class ModuleManifestReport {

    constructor(registry) {

        this.registry = registry;

        this.createdAt = new Date();

    }

    generate() {

        return this.registry

            .all()

            .map(

                manifest => manifest.all()

            );

    }

    toJSON() {

        return {

            createdAt: this.createdAt,

            total: this.registry.count(),

            manifests: this.generate()

        };

    }

}

module.exports = ModuleManifestReport;