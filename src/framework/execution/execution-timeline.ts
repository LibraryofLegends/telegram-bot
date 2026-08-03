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

Component...........: Execution Timeline

LOL-ID..............: LOL-EXECUTION-0008

File................: execution-timeline.ts

Location............: src/framework/execution/

===============================================================================
*/

export class TimelineEntry {

    constructor(

        public readonly timestamp = new Date(),

        public readonly stage: string,

        public readonly action: string,

        public readonly duration?: number

    ) {}

}

export class ExecutionTimeline {

    private readonly entries: TimelineEntry[] = [];

    /**
     * Adds a timeline entry.
     */
    public add(

        stage: string,

        action: string,

        duration?: number

    ): void {

        this.entries.push(

            new TimelineEntry(

                new Date(),

                stage,

                action,

                duration

            )

        );

    }

    /**
     * Returns every entry.
     */
    public getEntries():

        readonly TimelineEntry[] {

        return this.entries;

    }

    /**
     * Clears the timeline.
     */
    public clear(): void {

        this.entries.length = 0;

    }

}