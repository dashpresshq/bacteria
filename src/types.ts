export interface IConnectionOptions {
    host: string;
    port: number;
    databaseNames: string[];
    user: string;
    password: string;
    databaseType:
        | "mssql"
        | "postgres"
        | "mysql"
        | "mariadb"
        | "oracle"
        | "sqlite";
    schemaNames: string[];
    instanceName?: string;
    ssl: boolean;
    skipTables: string[];
    onlyTables: string[];
}
