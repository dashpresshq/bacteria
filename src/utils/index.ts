/* eslint-disable no-console */
export function LogError(
  errText: string,
  isABug = true,
  passedError: string | ErrorConstructor | unknown = {}
): void {
  let errObject = passedError;
  console.error(errText);
  console.error(`Error occurred at instrospection.`);
  if (isABug && !passedError) {
    errObject = new Error().stack;
  }
  if (errObject) {
    console.error(errObject);
  }
}
