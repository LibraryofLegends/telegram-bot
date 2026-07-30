'use strict';

class ModuleRepositorySnapshot {

    constructor(repository) {

        this.createdAt = new Date();

        this.entries = repository.count();

    }

    toJSON() {

        return {

            createdAt: this.createdAt,
            entries: this.entries

        };

    }

}

module.exports = ModuleRepositorySnapshot;