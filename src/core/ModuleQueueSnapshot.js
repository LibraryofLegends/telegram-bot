'use strict';

class ModuleQueueSnapshot {

    constructor(queue) {

        this.createdAt = new Date();

        this.count = queue.count();

    }

    toJSON() {

        return {

            createdAt: this.createdAt,
            count: this.count

        };

    }

}

module.exports = ModuleQueueSnapshot;