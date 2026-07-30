'use strict';

class ModuleFactorySnapshot {

    constructor(factory) {

        this.createdAt = new Date();

        this.entries = factory.count();

    }

    toJSON() {

        return {

            createdAt: this.createdAt,
            entries: this.entries

        };

    }

}

module.exports = ModuleFactorySnapshot;