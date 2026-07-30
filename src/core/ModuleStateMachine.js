'use strict';

class ModuleStateMachine {

    constructor(initialState = 'created') {

        this.state = initialState;
        this.transitions = new Map();

    }

    addTransition(from, to) {

        if (!this.transitions.has(from)) {

            this.transitions.set(from, new Set());

        }

        this.transitions.get(from).add(to);

        return this;

    }

    canTransition(to) {

        return this.transitions.has(this.state) &&

            this.transitions.get(this.state).has(to);

    }

    transition(to) {

        if (!this.canTransition(to)) {

            return false;

        }

        this.state = to;

        return true;

    }

    getState() {

        return this.state;

    }

}

module.exports = ModuleStateMachine;