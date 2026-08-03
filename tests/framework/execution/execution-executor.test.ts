/*
===============================================================================
                         LOAF FRAMEWORK

Execution Executor Integration Tests

===============================================================================
*/

import { describe, expect, test } from "vitest";

import { Execution } from "../../../src/framework/execution/execution";
import { ExecutionContext } from "../../../src/framework/execution/execution-context";
import { ExecutionExecutor } from "../../../src/framework/execution/execution-executor";
import { ExecutionStatus } from "../../../src/framework/execution/execution-status";

class TestExecutable {

    public async execute(

        context: ExecutionContext

    ): Promise<string> {

        context.set(

            "executed",

            true

        );

        return "SUCCESS";

    }

}

describe("ExecutionExecutor", () => {

    test(

        "executes executable successfully",

        async () => {

            const context =

                new ExecutionContext();

            const execution =

                new Execution(

                    "EXEC-0001",

                    context

                );

            const executor =

                new ExecutionExecutor();

            const result =

                await executor.execute(

                    execution,

                    new TestExecutable()

                );

            expect(

                execution.status

            ).toBe(

                ExecutionStatus.COMPLETED

            );

            expect(

                result.success

            ).toBe(

                true

            );

            expect(

                result.value

            ).toBe(

                "SUCCESS"

            );

            expect(

                context.get<boolean>(

                    "executed"

                )

            ).toBe(

                true

            );

        }

    );

});