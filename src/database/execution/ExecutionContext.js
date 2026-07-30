/**
 * ========================================================================
 * Library Of Legends 2.0
 * ------------------------------------------------------------------------
 * Datei:
 * src/database/execution/ExecutionContext.js
 * ========================================================================
 */

'use strict';

class ExecutionContext {

    constructor(repository, queryState) {

        this.repository = repository;

        this.queryState = queryState;

        this.sql = '';

        this.bindings = [];

        this.statement = null;

        this.result = null;

        this.startTime = null;

        this.endTime = null;

        this.metadata = new Map();

    }

    setSql(sql) {

        this.sql = sql;

        return this;

    }

    getSql() {

        return this.sql;

    }

    setBindings(bindings) {

        this.bindings = [...bindings];

        return this;

    }

    getBindings() {

        return [...this.bindings];

    }

    setResult(result) {

        this.result = result;

        return this;

    }

    getResult() {

        return this.result;

    }

    setMetadata(key, value) {

        this.metadata.set(key, value);

        return this;

    }

    getMetadata(key) {

        return this.metadata.get(key);

    }

    startTimer() {

        this.startTime = performance.now();

        return this;

    }

    stopTimer() {

        this.endTime = performance.now();

        return this;

    }

    getExecutionTime() {

        if (

            this.startTime === null ||

            this.endTime === null

        ) {

            return 0;

        }

        return this.endTime - this.startTime;

    }

}

module.exports = ExecutionContext;