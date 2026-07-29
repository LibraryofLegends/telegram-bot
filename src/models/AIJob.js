/**
 * ========================================================================
 * Library Of Legends 2.0
 * ========================================================================
 */

'use strict';

const BaseModel = require('./BaseModel');

class AIJob extends BaseModel {

    constructor(data = {}) {

        super({

            id: null,

            job_type: '',

            provider: '',

            model: '',

            prompt: '',

            response: '',

            tokens: 0,

            duration: 0,

            cost: 0,

            status: 'pending',

            started_at: null,

            finished_at: null,

            error: null,

            created_at: null,

            updated_at: null,

            deleted_at: null,

            ...data

        });

    }

}

module.exports = AIJob;