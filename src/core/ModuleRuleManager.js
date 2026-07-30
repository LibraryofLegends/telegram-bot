'use strict';

const ModuleRuleRegistry = require('./ModuleRuleRegistry');
const ModuleRuleHistory = require('./ModuleRuleHistory');

class ModuleRuleManager {

    constructor() {

        this.registry = new ModuleRuleRegistry();

        this.history = new ModuleRuleHistory();

    }

    register(rule) {

        this.registry.register(rule);

        this.history.add(

            rule.getName(),

            rule.isEnabled()

        );

        return this;

    }

    get(name) {

        return this.registry.get(name);

    }

    has(name) {

        return this.registry.has(name);

    }

    remove(name) {

        return this.registry.remove(name);

    }

    clear() {

        this.registry.clear();

        this.history.clear();

    }

}

module.exports = ModuleRuleManager;