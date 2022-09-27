// import OracleDriver from "./OracleDriver";
import SqliteDriver from "./SqliteDriver";
import PostgresDriver from "./PostgresDriver";
import MssqlDriver from "./MssqlDriver";
import MysqlDriver from "./MysqlDriver";
import AbstractDriver from "./AbstractDriver";
import { IRDMSConnectionOptions, RDMSSources } from "../types";

export function createDriver(
  connectionOptions: IRDMSConnectionOptions
): AbstractDriver {
  switch (connectionOptions.dataSourceType) {
    case RDMSSources.MsSql:
      return new MssqlDriver(connectionOptions);
    case RDMSSources.Postgres:
      return new PostgresDriver(connectionOptions);
    case RDMSSources.MySql:
      return new MysqlDriver(connectionOptions);
    // case RDMSSources.:
    //   return new OracleDriver(connectionOptions);
    case RDMSSources.Sqlite:
      return new SqliteDriver(connectionOptions);
    default:
      throw new Error("Database engine not recognized.");
  }
}
