import { RDMSSources, IRDMSConnectionOptions } from "./types";

export const option: IRDMSConnectionOptions = {
  dataSourceType: RDMSSources.Sqlite,
  filename: "../test-adaptor.sqlite",
};
