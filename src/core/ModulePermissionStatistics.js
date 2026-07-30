'use strict';

class ModulePermissionStatistics {

    constructor(registry) {

        this.registry = registry;

    }

    total() {

        return this.registry.count();

    }

    granted() {

        return this.registry
            .all()
            .filter(permission => permission.isGranted())
            .length;

    }

    revoked() {

        return this.total() - this.granted();

    }

    toJSON() {

        return {

            total: this.total(),
            granted: this.granted(),
            revoked: this.revoked()

        };

    }

}

module.exports = ModulePermissionStatistics;