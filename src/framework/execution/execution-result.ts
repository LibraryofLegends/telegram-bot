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

Component...........: Execution Result

LOL-ID..............: LOL-EXECUTION-0003

File................: execution-result.ts

Location............: src/framework/execution/

===============================================================================
*/

export class ExecutionResult<TResult = void> {

    /**
     * Indicates whether the execution succeeded.
     */
    public success = true;

    /**
     * Optional result.
     */
    public value?: TResult;

    /**
     * Optional error.
     */
    public error?: Error;

    /**
     * Execution duration.
     */
    public duration = 0;

}