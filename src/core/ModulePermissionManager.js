'use strict';

const ModulePermissionRegistry = require('./ModulePermissionRegistry');
const ModulePermissionHistory = require('./ModulePermissionHistory');

class ModulePermissionManager {

    constructor() {

        this.registry = new ModulePermissionRegistry();

        this.history = new ModulePermissionHistory();

    }

    register(permission) {

        this.registry.register(permission);

        this.history.add(

            permission.getName(),

            permission.isGranted()

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

module.exports = ModulePermissionManager;