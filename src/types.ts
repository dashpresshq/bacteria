export enum RDMSSources {
  Postgres = "postgres",
  MySql = "mysql",
  MsSql = "mssql",
  Sqlite = "sqlite",
}

export interface IRDMSConnectionOptions {
  dataSourceType: RDMSSources;
  connectionString?: string;
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  filename?: string;
  ssl?: boolean;
  schemaNames?: string[];
}
