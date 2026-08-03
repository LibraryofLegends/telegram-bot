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

Component...........: Execution Diagnostics

LOL-ID..............: LOL-EXECUTION-0009

File................: execution-diagnostics.ts

Location............: src/framework/execution/

===============================================================================

DESCRIPTION

Collects diagnostic information for a single execution.

===============================================================================
*/

export interface DiagnosticEntry {

    readonly timestamp: Date;

    readonly category: string;

    readonly severity:

        "info" |

        "warning" |

        "error";

    readonly message: string;

    readonly details?: unknown;

}

export class ExecutionDiagnostics {

    private readonly entries:

        DiagnosticEntry[] = [];

    /**
     * Adds a diagnostic entry.
     */
    public add(

        severity:

            "info" |

            "warning" |

            "error",

        category: string,

        message: string,

        details?: unknown

    ): void {

        this.entries.push({

            timestamp: new Date(),

            severity,

            category,

            message,

            details

        });

    }

    /**
     * Returns every diagnostic entry.
     */
    public getEntries():

        readonly DiagnosticEntry[] {

        return this.entries;

    }

    /**
     * Returns true if errors exist.
     */
    public hasErrors(): boolean {

        return this.entries.some(

            entry =>

                entry.severity === "error"

        );

    }

    /**
     * Clears diagnostics.
     */
    public clear(): void {

        this.entries.length = 0;

    }

}