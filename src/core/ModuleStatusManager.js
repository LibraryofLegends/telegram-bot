'use strict';

const ModuleStatus = require('./ModuleStatus');
const ModuleStatusRegistry = require('./ModuleStatusRegistry');
const ModuleStatusHistory = require('./ModuleStatusHistory');

class ModuleStatusManager {

    constructor() {

        this.registry = new ModuleStatusRegistry();

        this.history = new ModuleStatusHistory();

    }

    set(moduleName, status) {

        this.registry.set(

            moduleName,

            status

        );

        this.history.push(

            moduleName,

            status

        );

        return this;

    }

    get(moduleName) {

        return this.registry.get(moduleName);

    }

    has(moduleName) {

        return this.registry.has(moduleName);

    }

    remove(moduleName) {

        return this.registry.remove(moduleName);

    }

    reset(moduleName) {

        return this.set(

            moduleName,

            ModuleStatus.CREATED

        );

    }

    registryInstance() {

        return this.registry;

    }

    historyInstance() {

        return this.history;

    }

    clear() {

        this.registry.clear();

        this.history.clear();

    }

}

module.exports = ModuleStatusManager;