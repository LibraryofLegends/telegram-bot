'use strict';

class ModuleContainerSnapshot {

    constructor(container) {

        this.createdAt = new Date();

        this.services = container.count();

    }

    toJSON() {

        return {

            createdAt: this.createdAt,
            services: this.services

        };

    }

}

module.exports = ModuleContainerSnapshot;