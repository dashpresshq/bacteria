import { createDriver } from "./drivers";

import { IRDMSConnectionOptions, RDMSSources } from "./types";

export { makeDbConnection } from "./utils/connect";

export { Entity } from "./models/Entity";

export { RDMSSources, IRDMSConnectionOptions };

export async function introspect(connectionOptions: IRDMSConnectionOptions) {
  return await createDriver(connectionOptions).GetDataFromServer();
}
