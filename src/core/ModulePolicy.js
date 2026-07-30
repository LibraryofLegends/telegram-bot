'use strict';

class ModulePolicy {

    constructor(name, active = true) {

        this.name = name;
        this.active = active;

    }

    getName() {

        return this.name;

    }

    isActive() {

        return this.active;

    }

    activate() {

        this.active = true;

        return this;

    }

    deactivate() {

        this.active = false;

        return this;

    }

    toggle() {

        this.active = !this.active;

        return this;

    }

    toJSON() {

        return {

            name: this.name,
            active: this.active

        };

    }

}

module.exports = ModulePolicy;