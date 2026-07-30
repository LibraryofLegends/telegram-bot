'use strict';

class ModuleStatusStatistics {

    constructor(registry) {

        this.registry = registry;

    }

    total() {

        return this.registry.count();

    }

    byStatus(status) {

        return this.registry

            .all()

            .filter(

                ([, value]) => value === status

            )

            .length;

    }

    summary() {

        return {

            total: this.total(),

            created: this.byStatus('created'),

            registered: this.byStatus('registered'),

            initialized: this.byStatus('initialized'),

            booting: this.byStatus('booting'),

            running: this.byStatus('running'),

            stopping: this.byStatus('stopping'),

            stopped: this.byStatus('stopped'),

            failed: this.byStatus('failed'),

            disabled: this.byStatus('disabled')

        };

    }

    toJSON() {

        return this.summary();

    }

}

module.exports = ModuleStatusStatistics;