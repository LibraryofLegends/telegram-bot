'use strict';

const EntityEvent = require('./EntityEvent');

class AfterUpdateEvent extends EntityEvent {

    constructor(options = {}) {

        super({

            ...options,

            name: 'entity.afterUpdate'

        });

    }

}

module.exports = AfterUpdateEvent;