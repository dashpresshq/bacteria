import MariaDbDriver from "./MariaDbDriver";
import OracleDriver from "./OracleDriver";
import SqliteDriver from "./SqliteDriver";
import PostgresDriver from "./PostgresDriver";
import MssqlDriver from "./MssqlDriver";
import MysqlDriver from "./MysqlDriver";
import AbstractDriver from "./AbstractDriver";

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