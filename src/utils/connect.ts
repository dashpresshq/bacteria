import { knex } from "knex";
import { IRDMSConnectionOptions, RDMSSources } from "../types";

const SupportedDataSourceToKnexClientMap: Record<
  Partial<RDMSSources>,
  string
> = {
  mssql: "tedious",
  postgres: "pg",
  mysql: "mysql2",
  sqlite: "better-sqlite3",
};

const handleStringCredentials = (credentials: string) => {
  if (credentials.startsWith("sqlite")) {
    return knex({
      client: "better-sqlite3",
      connection: {
        filename: credentials.split(":")[1],
      },
      useNullAsDefault: true,
    });
  }

  return knex(credentials);
};

export const makeDbConnection = (
  credentials: IRDMSConnectionOptions | string
) => {
  if (typeof credentials === "string") {
    return handleStringCredentials(credentials);
  }

  if (credentials.connectionString) {
    return handleStringCredentials(credentials.connectionString);
  }

  if (credentials.dataSourceType === RDMSSources.Sqlite) {
    return handleStringCredentials(`sqlite:${credentials.filename}`);
  }

  return knex({
    client: SupportedDataSourceToKnexClientMap[credentials.dataSourceType],

    connection: {
      database: credentials.database,
      user: credentials.user,
      password: credentials.password,
      host: credentials.host,
      port: credentials.port,
      ssl: credentials.ssl,
    },
  });
};
