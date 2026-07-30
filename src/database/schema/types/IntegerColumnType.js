class IntegerColumnType extends ColumnType {

    getName() {

        return 'integer';

    }

    compile(driver) {

        switch (driver) {

            case 'sqlite':

                return 'INTEGER';

            case 'mysql':

                return 'INT';

            case 'postgres':

                return 'INTEGER';

            case 'mariadb':

                return 'INT';

        }

    }

}