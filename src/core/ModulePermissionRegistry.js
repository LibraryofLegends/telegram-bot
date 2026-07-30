'use strict';

class ModulePermissionRegistry {

    constructor() {

        this.permissions = new Map();

    }

    register(permission) {

        this.permissions.set(

            permission.getName(),

            permission

        );

        return this;

    }

    get(name) {

        return this.permissions.get(name) || null;

    }

    has(name) {

        return this.permissions.has(name);

    }

    remove(name) {

        return this.permissions.delete(name);

    }

    all() {

        return [...this.permissions.values()];

    }

    clear() {

        this.permissions.clear();

    }

    count() {

        return this.permissions.size;

    }

}

module.exports = ModulePermissionRegistry;