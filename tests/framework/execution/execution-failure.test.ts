class FailingExecutable {

    public async execute(): Promise<void> {

        throw new Error(

            "Intentional Test Error"

        );

    }

}