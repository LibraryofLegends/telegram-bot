/*
===============================================================================
██╗      ██████╗  █████╗ ███████╗
██║     ██╔═══██╗██╔══██╗██╔════╝
██║     ██║   ██║███████║█████╗
██║     ██║   ██║██╔══██║██╔══╝
███████╗╚██████╔╝██║  ██║██║
╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚═╝

                         LOAF FRAMEWORK

===============================================================================

Architecture Layer..: Framework

Subsystem...........: Execution Engine

Component...........: Execution Executor

LOL-ID..............: LOL-EXECUTION-0006

File................: execution-executor.ts

Location............: src/framework/execution/

===============================================================================

DESCRIPTION

Executes every executable object inside the LOAF Framework.

===============================================================================
*/

import { Execution } from "./execution";
import { ExecutionResult } from "./execution-result";

export interface Executable<TContext, TResult = void> {

    execute(

        context: TContext

    ): Promise<TResult>;

}

export class ExecutionExecutor {

    /**
     * Executes an executable object.
     */
    public async execute<

        TContext,

        TResult

    >(

        execution: Execution<TContext>,

        executable: Executable<TContext, TResult>

    ): Promise<ExecutionResult<TResult>> {

        const result =

            new ExecutionResult<TResult>();

        const started = Date.now();

        try {

            execution.start();

            result.value =

                await executable.execute(

                    execution.context

                );

            execution.complete();

        }

        catch (error) {

            execution.fail(

                error as Error

            );

            result.success = false;

            result.error =

                error as Error;

        }

        result.duration =

            Date.now() - started;

        return result;

    }

}