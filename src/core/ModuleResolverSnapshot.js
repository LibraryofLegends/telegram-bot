'use strict';

class ModuleResolverSnapshot {

    constructor(resolver) {

        this.createdAt = new Date();

        this.entries = resolver.count();

    }

    toJSON() {

        return {

            createdAt: this.createdAt,
            entries: this.entries

        };

    }

}

module.exports = ModuleResolverSnapshot;