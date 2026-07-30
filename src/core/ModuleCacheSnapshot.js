'use strict';

class ModuleCacheSnapshot {

    constructor(cache) {

        this.createdAt = new Date();

        this.entries = cache.count();

    }

    toJSON() {

        return {

            createdAt: this.createdAt,
            entries: this.entries

        };

    }

}

module.exports = ModuleCacheSnapshot;