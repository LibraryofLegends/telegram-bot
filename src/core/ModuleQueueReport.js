'use strict';

class ModuleQueueReport {

    constructor(registry) {

        this.registry = registry;

        this.createdAt = new Date();

    }

    generate() {

        return this.registry

            .all()

            .map(

                queue => queue.count()

            );

    }

    toJSON() {

        return {

            createdAt: this.createdAt,
            total: this.registry.count(),
            queues: this.generate()

        };

    }

}

module.exports = ModuleQueueReport;