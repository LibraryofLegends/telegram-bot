'use strict';

const EntityEvent = require('./EntityEvent');

class AfterRemoveEvent extends EntityEvent {

    constructor(options = {}) {

        super({

            ...options,

            name: 'entity.afterRemove'

        });

    }

}

module.exports = AfterRemoveEvent;