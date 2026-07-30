'use strict';

class ModuleRuleReport {

    constructor(registry) {

        this.registry = registry;

        this.createdAt = new Date();

    }

    generate() {

        return this.registry
            .all()
            .map(rule => rule.toJSON());

    }

    toJSON() {

        return {

            createdAt: this.createdAt,
            total: this.registry.count(),
            rules: this.generate()

        };

    }

}

module.exports = ModuleRuleReport;