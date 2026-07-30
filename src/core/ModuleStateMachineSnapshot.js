'use strict';

class ModuleStateMachineSnapshot {

    constructor(machine) {

        this.createdAt = new Date();
        this.state = machine.getState();

    }

    toJSON() {

        return {

            createdAt: this.createdAt,
            state: this.state

        };

    }

}

module.exports = ModuleStateMachineSnapshot;