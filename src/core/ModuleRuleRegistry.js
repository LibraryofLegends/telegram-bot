'use strict';

class ModuleRuleRegistry {

    constructor() {

        this.rules = new Map();

    }

    register(rule) {

        this.rules.set(
            rule.getName(),
            rule
        );

        return this;

    }

    get(name) {

        return this.rules.get(name) || null;

    }

    has(name) {

        return this.rules.has(name);

    }

    remove(name) {

        return this.rules.delete(name);

    }

    all() {

        return [...this.rules.values()];

    }

    clear() {

        this.rules.clear();

    }

    count() {

        return this.rules.size;

    }

}

module.exports = ModuleRuleRegistry;