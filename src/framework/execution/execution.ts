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
*/

import { ExecutionContext } from "./execution-context";
import { ExecutionStatus } from "./execution-status";

export class Execution<TContext extends ExecutionContext> {

    public readonly id: string;

    public readonly context: TContext;

    public status = ExecutionStatus.CREATED;

    public readonly createdAt = new Date();

    public startedAt?: Date;

    public finishedAt?: Date;

    public error?: Error;

    constructor(

        id: string,

        context: TContext

    ) {

        this.id = id;

        this.context = context;

    }

    public start(): void {

        this.status = ExecutionStatus.RUNNING;

        this.startedAt = new Date();

    }

    public complete(): void {

        this.status = ExecutionStatus.COMPLETED;

        this.finishedAt = new Date();

    }

    public fail(

        error: Error

    ): void {

        this.status = ExecutionStatus.FAILED;

        this.error = error;

        this.finishedAt = new Date();

    }

}