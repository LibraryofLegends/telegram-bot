'use strict';

class ModulePermission {

    constructor(name, granted = false) {

        this.name = name;
        this.granted = granted;

    }

    getName() {

        return this.name;

    }

    isGranted() {

        return this.granted;

    }

    grant() {

        this.granted = true;

        return this;

    }

    revoke() {

        this.granted = false;

        return this;

    }

    toggle() {

        this.granted = !this.granted;

        return this;

    }

    toJSON() {

        return {

            name: this.name,
            granted: this.granted

        };

    }

}

module.exports = ModulePermission;