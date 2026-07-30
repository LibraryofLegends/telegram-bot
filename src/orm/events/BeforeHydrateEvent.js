'use strict';

const EntityEvent = require('./EntityEvent');

class BeforeHydrateEvent extends EntityEvent {

    constructor(options = {}) {

        super({

            ...options,

            name: 'entity.beforeHydrate'

        });

    }

}

module.exports = BeforeHydrateEvent;