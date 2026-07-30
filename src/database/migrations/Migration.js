'use strict';

class Migration {

    constructor(context) {

        this.context = context;

        this.schema = context.schema;

        this.connection = context.connection;

        this.driver = context.driver;

    }

    /**
     * Migration anwenden.
     */

    async up() {

        throw new Error(

            'up() muss implementiert werden.'

        );

    }

    /**
     * Migration zurückrollen.
     */

    async down() {

        throw new Error(

            'down() muss implementiert werden.'

        );

    }

}

module.exports = Migration;