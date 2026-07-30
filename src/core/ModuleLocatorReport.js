'use strict';

class ModuleLocatorReport {

    constructor(registry) {

        this.registry = registry;

        this.createdAt = new Date();

    }

    generate() {

        return this.registry
            .all()
            .map(locator => locator.count());

    }

    toJSON() {

        return {

            createdAt: this.createdAt,
            total: this.registry.count(),
            locators: this.generate()

        };

    }

}

module.exports = ModuleLocatorReport;