'use strict';

const PipelineStage =

    require('../PipelineStage');

class CompileStage extends PipelineStage {

    constructor(compiler) {

        super();

        this.compiler = compiler;

    }

    async handle(context, next) {

        const compiled =

            this.compiler.compile(

                context.queryState

            );

        context

            .setSql(

                compiled.sql

            )

            .setBindings(

                compiled.bindings

            );

        return next(context);

    }

}

module.exports = CompileStage;