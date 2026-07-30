'use strict';

class ModuleStackReport {

    constructor(registry) {

        this.registry = registry;

        this.createdAt = new Date();

    }

    generate() {

        return this.registry
            .all()
            .map(stack => stack.count());

    }

    toJSON() {

        return {

            createdAt: this.createdAt,
            total: this.registry.count(),
            stacks: this.generate()

        };

    }

}

module.exports = ModuleStackReport;