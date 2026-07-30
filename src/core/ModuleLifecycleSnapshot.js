'use strict';

class ModuleLifecycleSnapshot {

    constructor(lifecycle) {

        this.createdAt = new Date();

        this.phase = lifecycle.current();

        this.timeline = lifecycle.timeline();

    }

    getPhase() {

        return this.phase;

    }

    getTimeline() {

        return [...this.timeline];

    }

    toJSON() {

        return {

            createdAt: this.createdAt,
            phase: this.phase,
            timeline: this.timeline

        };

    }

}

module.exports = ModuleLifecycleSnapshot;