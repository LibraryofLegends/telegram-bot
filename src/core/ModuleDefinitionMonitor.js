'use strict';

class ModuleDefinitionMonitor {

    constructor(registry) {

        this.registry = registry;

        this.checkedAt = null;

    }

    check() {

        this.checkedAt = new Date();

        return {

            checkedAt: this.checkedAt,

            definitions: this.registry.count()

        };

    }

    getCheckedAt() {

        return this.checkedAt;

    }

}

module.exports = ModuleDefinitionMonitor;