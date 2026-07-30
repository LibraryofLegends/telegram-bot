'use strict';

class ModulePipelineSnapshot {

    constructor(pipeline) {

        this.createdAt = new Date();

        this.steps = pipeline.count();

    }

    toJSON() {

        return {

            createdAt: this.createdAt,
            steps: this.steps

        };

    }

}

module.exports = ModulePipelineSnapshot;