'use strict';

class ModuleStateMachineReport {

    constructor(registry) {

        this.registry = registry;
        this.createdAt = new Date();

    }

    generate() {

        return this.registry
            .all()
            .map(machine => machine.getState());

    }

    toJSON() {

        return {

            createdAt: this.createdAt,
            total: this.registry.count(),
            states: this.generate()

        };

    }

}

module.exports = ModuleStateMachineReport;