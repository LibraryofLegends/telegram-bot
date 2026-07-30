'use strict';

class ModuleDescriptorSnapshot {

    constructor(descriptor) {

        this.createdAt = new Date();

        this.data = {

            name: descriptor.getName(),
            description: descriptor.getDescription(),
            version: descriptor.getVersion(),
            author: descriptor.getAuthor()

        };

    }

    toJSON() {

        return {

            createdAt: this.createdAt,
            descriptor: this.data

        };

    }

}

module.exports = ModuleDescriptorSnapshot;