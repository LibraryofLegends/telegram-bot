/*
===============================================================================
                         LOAF FRAMEWORK
===============================================================================

Component...........: Execution History

LOL-ID..............: LOL-EXECUTION-0005

===============================================================================
*/

export class ExecutionHistoryEntry {

    constructor(

        public readonly timestamp: Date,

        public readonly message: string,

        public readonly level:

            "info" |

            "warning" |

            "error"

    ) {}

}

export class ExecutionHistory {

    private readonly entries:

        ExecutionHistoryEntry[] = [];

    /**
     * Adds a history entry.
     */
    public add(

        level:

            "info" |

            "warning" |

            "error",

        message: string

    ): void {

        this.entries.push(

            new ExecutionHistoryEntry(

                new Date(),

                message,

                level

            )

        );

    }

    /**
     * Returns all entries.
     */
    public getEntries():

        readonly ExecutionHistoryEntry[] {

        return this.entries;

    }

}