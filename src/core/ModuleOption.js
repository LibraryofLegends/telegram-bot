'use strict';

class ModuleOption {

    constructor(name, value = null) {

        this.name = name;
        this.value = value;

    }

    getName() {

        return this.name;

    }

    getValue() {

        return this.value;

    }

    setValue(value) {

        this.value = value;

        return this;

    }

    toJSON() {

        return {

            name: this.name,
            value: this.value

        };

    }

}

module.exports = ModuleOption;