/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: RepositoryTransaction

Architecture Layer..: Framework Core

Module..............: Repository Framework

Module ID...........: LOL-MOD-REP-0007

LOL-ID..............: LOL-FRM-REP-0008

File................: repository-transaction.ts

Location............
Library Of Legends/src/framework/repository-framework/src/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Defines the official transaction contract used throughout the
Project Phoenix Repository Framework.

===============================================================================

Responsibilities

• Start transactions
• Commit transactions
• Roll back transactions
• Support nested transactions
• Support savepoints

===============================================================================

Design Decisions

• Interface-based design
• Provider-independent
• Promise-based API
• Framework-wide compatibility
• Enterprise ready

===============================================================================

Future Extensions

• Distributed transactions
• Automatic retries
• Transaction metrics
• Transaction tracing
• Timeout handling

===============================================================================
*/

/**
 * Supported transaction isolation levels.
 */
export type TransactionIsolationLevel =
    | "read-uncommitted"
    | "read-committed"
    | "repeatable-read"
    | "serializable";

/**
 * Official repository transaction contract.
 */
export interface RepositoryTransaction {

    /**
     * Unique transaction identifier.
     */
    readonly id: string;

    /**
     * Indicates whether this transaction is read-only.
     */
    readonly readOnly: boolean;

    /**
     * Transaction isolation level.
     */
    readonly isolationLevel: TransactionIsolationLevel;

    /**
     * Starts the transaction.
     */
    begin(): Promise<void>;

    /**
     * Commits the transaction.
     */
    commit(): Promise<void>;

    /**
     * Rolls back the transaction.
     */
    rollback(): Promise<void>;

    /**
     * Creates a savepoint.
     */
    createSavepoint(
        name: string
    ): Promise<void>;

    /**
     * Rolls back to a savepoint.
     */
    rollbackToSavepoint(
        name: string
    ): Promise<void>;

    /**
     * Releases a savepoint.
     */
    releaseSavepoint(
        name: string
    ): Promise<void>;

}