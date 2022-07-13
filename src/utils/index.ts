export function LogError(
    errText: string,
    isABug = true,
    passedError?: string | ErrorConstructor | unknown
): void {
    let errObject = passedError;
    console.error(errText);
    console.error(`Error occurred in typeorm-model-generator.`);
    // console.error(`${packageVersion()}  node@${process.version}`);
    // console.error(
    //     `If you think this is a bug please open an issue including this log on ${packagejson.bugs.url}`
    // );
    if (isABug && !passedError) {
        errObject = new Error().stack;
    }
    if (errObject) {
        console.error(errObject);
    }
}
