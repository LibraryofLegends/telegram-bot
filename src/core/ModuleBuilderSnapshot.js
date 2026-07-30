'use strict';

class ModuleBuilderSnapshot {

    constructor(builder) {

        this.createdAt = new Date();

        this.entries = builder.count();

    }

    toJSON() {

        return {

            createdAt: this.createdAt,
            entries: this.entries

        };

    }

}

module.exports = ModuleBuilderSnapshot;