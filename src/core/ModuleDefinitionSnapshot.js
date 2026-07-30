'use strict';

class ModuleDefinitionSnapshot {

    constructor(definition) {

        this.createdAt = new Date();

        this.definition = definition.all();

    }

    toJSON() {

        return {

            createdAt: this.createdAt,

            definition: this.definition

        };

    }

}

module.exports = ModuleDefinitionSnapshot;