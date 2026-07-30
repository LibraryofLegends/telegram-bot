'use strict';

class ModuleDescriptorReport {

    constructor(registry) {

        this.registry = registry;

        this.createdAt = new Date();

    }

    generate() {

        return this.registry.all().map(descriptor => ({

            name: descriptor.getName(),
            version: descriptor.getVersion()

        }));

    }

    toJSON() {

        return {

            createdAt: this.createdAt,
            total: this.registry.count(),
            descriptors: this.generate()

        };

    }

}

module.exports = ModuleDescriptorReport;