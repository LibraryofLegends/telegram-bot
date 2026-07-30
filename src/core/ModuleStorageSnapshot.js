'use strict';

class ModuleStorageSnapshot {

    constructor(storage) {

        this.createdAt = new Date();

        this.entries = storage.count();

    }

    toJSON() {

        return {

            createdAt: this.createdAt,
            entries: this.entries

        };

    }

}

module.exports = ModuleStorageSnapshot;