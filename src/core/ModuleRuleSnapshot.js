'use strict';

class ModuleRuleSnapshot {

    constructor(rule) {

        this.createdAt = new Date();

        this.data = rule.toJSON();

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
            rule: this.data

        };

    }

}

module.exports = ModuleRuleSnapshot;