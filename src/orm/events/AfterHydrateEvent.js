'use strict';

const EntityEvent = require('./EntityEvent');

class AfterHydrateEvent extends EntityEvent {

    constructor(options = {}) {

        super({

            ...options,

            name: 'entity.afterHydrate'

        });

    }

}

module.exports = AfterHydrateEvent;