'use strict';

class ModuleSettingsMonitor {

    constructor(registry) {

        this.registry = registry;

        this.checkedAt = null;

    }

    check() {

        this.checkedAt = new Date();

        return {

            checkedAt: this.checkedAt,

            modules: this.registry.count()

        };

    }

    toJSON() {

        return this.check();

    }

}

module.exports = ModuleSettingsMonitor;