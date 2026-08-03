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

Component...........: Execution Events

LOL-ID..............: LOL-EXECUTION-0007

File................: execution-events.ts

Location............: src/framework/execution/

===============================================================================
*/

export enum ExecutionEventType {

    CREATED,

    STARTED,

    STAGE_STARTED,

    STAGE_COMPLETED,

    PAUSED,

    RESUMED,

    RETRY,

    COMPLETED,

    FAILED,

    CANCELLED

}

export class ExecutionEvent {

    constructor(

        public readonly type: ExecutionEventType,

        public readonly timestamp: Date = new Date(),

        public readonly payload?: unknown

    ) {}

}