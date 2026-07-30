'use strict';

class ModuleConfigMonitor {

    constructor(registry) {

        this.registry = registry;

        this.checkedAt = null;

    }

    check() {

        this.checkedAt = new Date();

        return {

            checkedAt: this.checkedAt,

            configs: this.registry.count()

        };

    }

    toJSON() {

        return this.check();

    }

}

module.exports = ModuleConfigMonitor;