/**
 * ========================================================================
 * Library Of Legends 2.0
 * ------------------------------------------------------------------------
 * Datei:
 * src/database/expressions/FunctionExpression.js
 * ========================================================================
 */

'use strict';

const Expression = require('./Expression');

class FunctionExpression extends Expression {

    /**
     * @param {string} name
     * @param {Array<Expression>} arguments
     */
    constructor(name, argumentsList = []) {

        super(name);

        this.name = name.toUpperCase();

        this.arguments = argumentsList;

    }

    /**
     * SQL erzeugen.
     */

    compile(grammar) {

        const compiled = this.arguments.map(argument => {

            return argument.compile(grammar);

        });

        return `${this.name}(${compiled.join(', ')})`;

    }

    /**
     * Bindings sammeln.
     */

    bindings() {

        const bindings = [];

        for (const argument of this.arguments) {

            bindings.push(

                ...argument.bindings()

            );

        }

        return bindings;

    }

}

module.exports = FunctionExpression;