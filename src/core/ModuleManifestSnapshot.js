'use strict';

class ModuleManifestSnapshot {

    constructor(manifest) {

        this.createdAt = new Date();

        this.data = manifest.all();

    }

    toJSON() {

        return {

            createdAt: this.createdAt,

            manifest: this.data

        };

    }

}

module.exports = ModuleManifestSnapshot;