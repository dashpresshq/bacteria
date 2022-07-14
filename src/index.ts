import { createDriver } from "./drivers";

import { IConnectionOptions } from "./types";

export { Entity } from "./models/Entity";

export async function introspect(connectionOptions: IConnectionOptions) {
  return await createDriver(connectionOptions.databaseType).GetDataFromServer(
    connectionOptions
  );
}
