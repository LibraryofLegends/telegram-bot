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

Component...........: Execution Status

LOL-ID..............: LOL-EXECUTION-0002

File................: execution-status.ts

Location............: src/framework/execution/

===============================================================================
*/

export enum ExecutionStatus {

    CREATED,

    INITIALIZING,

    WAITING,

    RUNNING,

    PAUSED,

    RETRYING,

    COMPLETED,

    CANCELLED,

    FAILED

}