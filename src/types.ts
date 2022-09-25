export interface IConnectionOptions {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl: boolean;
  dataSourceType:
    | "mssql"
    | "postgres"
    | "mysql"
    | "mariadb"
    | "oracle"
    | "sqlite";
  schemaNames: string[];
  instanceName?: string;
}
