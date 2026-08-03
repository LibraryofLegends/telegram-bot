const context = new ExecutionContext();

const execution =

    new Execution(

        "DEMO-0001",

        context

    );

const executor =

    new ExecutionExecutor();

const result =

    await executor.execute(

        execution,

        new HelloWorldExecutable()

    );

console.log(result);