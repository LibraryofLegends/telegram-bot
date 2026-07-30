'use strict';

const EntityEvent = require('./EntityEvent');

class BeforeRemoveEvent extends EntityEvent {

    constructor(options = {}) {

        super({

            ...options,

            name: 'entity.beforeRemove'

        });

    }

}

module.exports = BeforeRemoveEvent;