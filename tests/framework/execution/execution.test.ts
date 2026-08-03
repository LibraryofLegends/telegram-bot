/*
===============================================================================
                         LOAF FRAMEWORK

Execution Engine Tests

===============================================================================
*/

import { describe, expect, test } from "vitest";

import { Execution } from "../../../src/framework/execution/execution";
import { ExecutionContext } from "../../../src/framework/execution/execution-context";
import { ExecutionStatus } from "../../../src/framework/execution/execution-status";

describe("Execution", () => {

    test("creates execution", () => {

        const context =

            new ExecutionContext();

        const execution =

            new Execution(

                "TEST-0001",

                context

            );

        expect(

            execution.id

        ).toBe(

            "TEST-0001"

        );

        expect(

            execution.status

        ).toBe(

            ExecutionStatus.CREATED

        );

    });

    test("starts execution", () => {

        const execution =

            new Execution(

                "TEST",

                new ExecutionContext()

            );

        execution.start();

        expect(

            execution.status

        ).toBe(

            ExecutionStatus.RUNNING

        );

    });

    test("completes execution", () => {

        const execution =

            new Execution(

                "TEST",

                new ExecutionContext()

            );

        execution.start();

        execution.complete();

        expect(

            execution.status

        ).toBe(

            ExecutionStatus.COMPLETED

        );

    });

    test("fails execution", () => {

        const execution =

            new Execution(

                "TEST",

                new ExecutionContext()

            );

        execution.fail(

            new Error(

                "Boom"

            )

        );

        expect(

            execution.status

        ).toBe(

            ExecutionStatus.FAILED

        );

        expect(

            execution.error

        ).toBeDefined();

    });

});