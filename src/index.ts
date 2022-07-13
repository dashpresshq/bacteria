import MariaDbDriver from "./drivers/MariaDbDriver";
import OracleDriver from "./drivers/OracleDriver";
import SqliteDriver from "./drivers/SqliteDriver";
import PostgresDriver from "./drivers/PostgresDriver";
import MssqlDriver from "./drivers/MssqlDriver";
import MysqlDriver from "./drivers/MysqlDriver";
import AbstractDriver from "./drivers/AbstractDriver";
import { Entity } from "./models/Entity";

import fs = require("fs-extra");
import path = require("path");

import { IConnectionOptions } from "./types";

const option : IConnectionOptions = {
    databaseType: "postgres",
    host: "localhost",
    password: "password",
    schemaNames: ['public'],
    databaseName: "kademiks",
    port: 5432,
    ssl: false,
    user: "postgres"
};

// const option : IConnectionOptions = {
//   databaseType: "mysql",
//   host: "127.0.0.1",
//   password: "password",
//   schemaNames: ['public'],
//   databaseName: "classicmodels",
//   user: "username",
//   port: 3306,
//   ssl: false,
// };

CliLogic(option)

export async function CliLogic(connectionOptions: IConnectionOptions) {
    const driver = createDriver(connectionOptions.databaseType);

    await createModelFromDatabase(
        driver,
        connectionOptions,
    );
}

export function createDriver(driverName: string): AbstractDriver {
  switch (driverName) {
      case "mssql":
          return new MssqlDriver();
      case "postgres":
          return new PostgresDriver();
      case "mysql":
          return new MysqlDriver();
      case "mariadb":
          return new MariaDbDriver();
    //   case "oracle":
    //       return new OracleDriver();
      case "sqlite":
          return new SqliteDriver();
      default:
          throw new Error("Database engine not recognized.");
  }
}

export async function createModelFromDatabase(
  driver: AbstractDriver,
  connectionOptions: IConnectionOptions,
): Promise<void> {
  const dbSchema = await getDBSchema(
      driver,
      connectionOptions,
  );
  await fs.writeJson(
      path.resolve(process.cwd(), "schema.json"),
      dbSchema,
      { spaces: 2 }
  );
}

export async function getDBSchema(
  driver: AbstractDriver,
  connectionOptions: IConnectionOptions,
): Promise<Entity[]> {
  return driver.GetDataFromServer(connectionOptions);
}
