'use strict';

class ModuleMetadataSnapshot {

    constructor(metadata) {

        this.createdAt = new Date();

        this.data = metadata.entries();

    }

    toJSON() {

        return {

            createdAt: this.createdAt,

            metadata: this.data

        };

    }

}

module.exports = ModuleMetadataSnapshot;