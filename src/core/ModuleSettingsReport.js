'use strict';

class ModuleSettingsReport {

    constructor(registry) {

        this.registry = registry;

        this.createdAt = new Date();

    }

    generate() {

        return this.registry

            .all()

            .map(settings => settings.all());

    }

    toJSON() {

        return {

            createdAt: this.createdAt,

            total: this.registry.count(),

            settings: this.generate()

        };

    }

}

module.exports = ModuleSettingsReport;