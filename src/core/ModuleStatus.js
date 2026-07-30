'use strict';

class ModuleStatus {

    static CREATED = 'created';
    static REGISTERED = 'registered';
    static INITIALIZED = 'initialized';
    static BOOTING = 'booting';
    static RUNNING = 'running';
    static STOPPING = 'stopping';
    static STOPPED = 'stopped';
    static FAILED = 'failed';
    static DISABLED = 'disabled';

    constructor(status = ModuleStatus.CREATED) {

        this.status = status;
        this.updatedAt = new Date();

    }

    get() {

        return this.status;

    }

    set(status) {

        this.status = status;
        this.updatedAt = new Date();

        return this;

    }

    is(status) {

        return this.status === status;

    }

    getUpdatedAt() {

        return this.updatedAt;

    }

    toJSON() {

        return {

            status: this.status,
            updatedAt: this.updatedAt

        };

    }

}

module.exports = ModuleStatus;