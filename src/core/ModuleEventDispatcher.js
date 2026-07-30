'use strict';

class ModuleEventDispatcher {

    constructor(eventBus = null) {

        this.eventBus = eventBus;

    }

    dispatch(event) {

        if (

            this.eventBus &&

            typeof this.eventBus.emit === 'function'

        ) {

            this.eventBus.emit(

                event.name,

                event

            );

        }

        return event;

    }

}

module.exports = ModuleEventDispatcher;