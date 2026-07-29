/**
 * ========================================================================
 * Library Of Legends 2.0
 * ========================================================================
 */

'use strict';

const BaseModel = require('./BaseModel');

class Workflow extends BaseModel {

    constructor(data = {}) {

        super({

            id: null,

            type: '',

            status: 'pending',

            priority: 0,

            started_at: null,

            finished_at: null,

            duration: 0,

            input: {},

            output: {},

            error: null,

            retries: 0,

            created_at: null,

            updated_at: null,

            deleted_at: null,

            ...data

        });

    }

}

module.exports = Workflow;