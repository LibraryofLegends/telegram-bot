'use strict';

const Driver = require('./Driver');

class SQLiteDriver extends Driver {

    async select(sql, bindings = []) {

        const statement =

            this.connection.prepare(sql);

        return statement.all(...bindings);

    }

    async insert(sql, bindings = []) {

        const statement =

            this.connection.prepare(sql);

        return statement.run(...bindings);

    }

    async update(sql, bindings = []) {

        const statement =

            this.connection.prepare(sql);

        return statement.run(...bindings);

    }

    async delete(sql, bindings = []) {

        const statement =

            this.connection.prepare(sql);

        return statement.run(...bindings);

    }

    async execute(sql, bindings = []) {

        const statement =

            this.connection.prepare(sql);

        return statement.run(...bindings);

    }

    beginTransaction() {

        this.connection.exec(

            'BEGIN'

        );

    }

    commit() {

        this.connection.exec(

            'COMMIT'

        );

    }

    rollback() {

        this.connection.exec(

            'ROLLBACK'

        );

    }

}

module.exports = SQLiteDriver;