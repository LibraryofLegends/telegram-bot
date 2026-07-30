'use strict';

class ModulePipelineReport {

    constructor(registry) {

        this.registry = registry;

        this.createdAt = new Date();

    }

    generate() {

        return this.registry
            .all()
            .map(

                pipeline => pipeline.count()

            );

    }

    toJSON() {

        return {

            createdAt: this.createdAt,
            total: this.registry.count(),
            pipelines: this.generate()

        };

    }

}

module.exports = ModulePipelineReport;