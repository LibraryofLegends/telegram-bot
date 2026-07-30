'use strict';

class ModuleCacheMonitor {

    constructor(registry) {

        this.registry = registry;

        this.checkedAt = null;

    }

    check() {

        this.checkedAt = new Date();

        return {

            checkedAt: this.checkedAt,
            caches: this.registry.count()

        };

    }

    getCheckedAt() {

        return this.checkedAt;

    }

}

module.exports = ModuleCacheMonitor;