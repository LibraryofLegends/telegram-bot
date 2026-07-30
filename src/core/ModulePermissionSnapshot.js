'use strict';

class ModulePermissionSnapshot {

    constructor(permission) {

        this.createdAt = new Date();

        this.data = permission.toJSON();

    }

    getCreatedAt() {

        return this.createdAt;

    }

    getData() {

        return this.data;

    }

    toJSON() {

        return {

            createdAt: this.createdAt,
            permission: this.data

        };

    }

}

module.exports = ModulePermissionSnapshot;