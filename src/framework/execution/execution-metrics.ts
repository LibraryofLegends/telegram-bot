/*
===============================================================================
                         LOAF FRAMEWORK
===============================================================================

Component...........: Execution Metrics

LOL-ID..............: LOL-EXECUTION-0004

===============================================================================
*/

export class ExecutionMetrics {

    /**
     * Start timestamp.
     */
    public startedAt?: Date;

    /**
     * End timestamp.
     */
    public finishedAt?: Date;

    /**
     * Total duration.
     */
    public duration = 0;

    /**
     * Number of retries.
     */
    public retries = 0;

    /**
     * Warnings.
     */
    public warnings = 0;

    /**
     * Errors.
     */
    public errors = 0;

    /**
     * Memory usage.
     */
    public memoryUsage = 0;

}