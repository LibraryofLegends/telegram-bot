'use strict';

class ModuleCapability {

    constructor(name, enabled = true) {

        this.name = name;
        this.enabled = enabled;

    }

    getName() {

        return this.name;

    }

    isEnabled() {

        return this.enabled;

    }

    enable() {

        this.enabled = true;

        return this;

    }

    disable() {

        this.enabled = false;

        return this;

    }

    toggle() {

        this.enabled = !this.enabled;

        return this;

    }

    toJSON() {

        return {

            name: this.name,
            enabled: this.enabled

        };

    }

}

module.exports = ModuleCapability;