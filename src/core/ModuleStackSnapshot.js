'use strict';

class ModuleStackSnapshot {

    constructor(stack) {

        this.createdAt = new Date();

        this.count = stack.count();

    }

    toJSON() {

        return {

            createdAt: this.createdAt,
            count: this.count

        };

    }

}

module.exports = ModuleStackSnapshot;