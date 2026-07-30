'use strict';

class ModuleLocatorSnapshot {

    constructor(locator) {

        this.createdAt = new Date();

        this.entries = locator.count();

    }

    toJSON() {

        return {

            createdAt: this.createdAt,
            entries: this.entries

        };

    }

}

module.exports = ModuleLocatorSnapshot;