import { IRDMSConnectionOptions, RDMSSources } from "./types";

export const option: IRDMSConnectionOptions = {
  dataSourceType: RDMSSources.Postgres,
  user: "postgres",
  host: "localhost",
  password: "password",
  schemaNames: ["public"],
  database: "my_database",
  port: 5432,
  ssl: false,
};
