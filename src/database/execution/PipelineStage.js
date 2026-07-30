'use strict';

class PipelineStage {

    async handle(context, next) {

        return next(context);

    }

}

module.exports = PipelineStage;