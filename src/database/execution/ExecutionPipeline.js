'use strict';

class ExecutionPipeline {

    constructor(stages = []) {

        this.stages = stages;

    }

    add(stage) {

        this.stages.push(stage);

        return this;

    }

    async execute(context) {

        let index = -1;

        const dispatch = async (ctx) => {

            index++;

            if (index >= this.stages.length) {

                return ctx;

            }

            const stage =

                this.stages[index];

            return stage.handle(

                ctx,

                dispatch

            );

        };

        return dispatch(context);

    }

}

module.exports = ExecutionPipeline;