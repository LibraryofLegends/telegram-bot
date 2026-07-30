'use strict';

class ModuleStatusSnapshot {

    constructor(name, status) {

        this.timestamp = new Date();

        this.name = name;

        this.status = status;

    }

    getName() {

        return this.name;

    }

    getStatus() {

        return this.status;

    }

    getTimestamp() {

        return this.timestamp;

    }

    toJSON() {

        return {

            timestamp: this.timestamp,
            name: this.name,
            status: this.status

        };

    }

}

module.exports = ModuleStatusSnapshot;