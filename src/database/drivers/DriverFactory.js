'use strict';

const SQLiteDriver =

    require('./SQLiteDriver');

const PostgreSQLDriver =

    require('./PostgreSQLDriver');

const MySQLDriver =

    require('./MySQLDriver');

const MariaDBDriver =

    require('./MariaDBDriver');

class DriverFactory {

    static create(type, connection) {

        switch (

            String(type)

                .toLowerCase()

        ) {

            case 'sqlite':

                return new SQLiteDriver(

                    connection

                );

            case 'postgres':

            case 'postgresql':

                return new PostgreSQLDriver(

                    connection

                );

            case 'mysql':

                return new MySQLDriver(

                    connection

                );

            case 'mariadb':

                return new MariaDBDriver(

                    connection

                );

            default:

                throw new Error(

                    `Unbekannter Driver: ${type}`

                );

        }

    }

}

module.exports = DriverFactory;