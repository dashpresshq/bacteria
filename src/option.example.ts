import { IConnectionOptions } from "./types";

export const option: IConnectionOptions = {
  dataSourceType: "postgres",
  user: "postgres",
  host: "localhost",
  password: "password",
  schemaNames: ["public"],
  database: "my_database",
  port: 5432,
  ssl: false,
};
