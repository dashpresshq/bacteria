import { LogError } from "../utils";
import AbstractDriver from "./AbstractDriver";
import { Entity } from "../models/Entity";
import { Column } from "../models/Column";
import { Index } from "../models/Index";
import { RelationInternal } from "../models/RelationInternal";
import {
  COLUMN_TYPES_WITH_LENGTH,
  COLUMN_TYPES_WITH_PRECISION,
  COLUMN_TYPES_WITH_WIDTH,
} from "./_constants";
import { IRDMSConnectionOptions } from "../types";

export default class SqliteDriver extends AbstractDriver {
  constructor(connectionOptions: IRDMSConnectionOptions) {
    super(connectionOptions);
  }

  private tablesWithGeneratedPrimaryKey: string[] = [];

  public formatQuery<T>(data: unknown[]) {
    return data as T[];
  }

  public async GetAllTables(): Promise<Entity[]> {
    const ret: Entity[] = [] as Entity[];
    // eslint-disable-next-line camelcase
    const rows = await this.runQuery<{ tbl_name: string; sql: string }>(
      `SELECT tbl_name, sql FROM "sqlite_master" WHERE "type" = 'table'  AND name NOT LIKE 'sqlite_%'`
    );
    rows.forEach((val) => {
      if (val.sql.includes("AUTOINCREMENT")) {
        this.tablesWithGeneratedPrimaryKey.push(val.tbl_name);
      }
      ret.push({
        columns: [],
        indices: [],
        relations: [],
        relationIds: [],
        name: val.tbl_name,
      });
    });
    return ret;
  }

  public async GetCoulmnsFromEntity(entities: Entity[]): Promise<Entity[]> {
    await Promise.all(
      entities.map(async (ent) => {
        const response = await this.runQuery<{
          cid: number;
          name: string;
          type: string;
          notnull: number;
          // eslint-disable-next-line camelcase
          dflt_value: string;
          pk: number;
        }>(`PRAGMA table_info('${ent.name}');`);
        response.forEach((resp) => {
          const tscName = resp.name;
          let tscType = "";
          const options: Column["options"] = { name: resp.name };
          if (resp.notnull === 0) options.nullable = true;
          const isPrimary = resp.pk > 0 ? true : undefined;
          const defaultValue = SqliteDriver.ReturnDefaultValueFunction(
            resp.dflt_value
          );
          const columnType = resp.type
            .replace(/\([0-9 ,]+\)/g, "")
            .toLowerCase()
            .trim();
          const generated =
            isPrimary && this.tablesWithGeneratedPrimaryKey.includes(ent.name)
              ? true
              : undefined;
          switch (columnType) {
            case "int":
              tscType = "number";
              break;
            case "integer":
              tscType = "number";
              break;
            case "int2":
              tscType = "number";
              break;
            case "int8":
              tscType = "number";
              break;
            case "tinyint":
              tscType = "number";
              break;
            case "smallint":
              tscType = "number";
              break;
            case "mediumint":
              tscType = "number";
              break;
            case "bigint":
              tscType = "number";
              break;
            case "unsigned big int":
              tscType = "number";
              break;
            case "character":
              tscType = "string";
              break;
            case "varchar":
              tscType = "string";
              break;
            case "varying character":
              tscType = "string";
              break;
            case "nchar":
              tscType = "string";
              break;
            case "native character":
              tscType = "string";
              break;
            case "nvarchar":
              tscType = "string";
              break;
            case "text":
              tscType = "string";
              break;
            case "blob":
              tscType = "Buffer";
              break;
            case "clob":
              tscType = "string";
              break;
            case "real":
              tscType = "number";
              break;
            case "double":
              tscType = "number";
              break;
            case "double precision":
              tscType = "number";
              break;
            case "float":
              tscType = "number";
              break;
            case "numeric":
              tscType = "number";
              break;
            case "decimal":
              tscType = "number";
              break;
            case "boolean":
              tscType = "boolean";
              break;
            case "date":
              tscType = "Date";
              break;
            case "datetime":
              tscType = "Date";
              break;
            default:
              tscType = "NonNullable<unknown>";
              LogError(
                `Unknown column type: ${columnType}  table name: ${ent.name} column name: ${resp.name}`
              );
              break;
          }
          const sqlOptions = resp.type.match(/\([0-9 ,]+\)/g);
          if (
            COLUMN_TYPES_WITH_PRECISION.some((v) => v === columnType) &&
            sqlOptions
          ) {
            options.precision = Number.parseInt(
              sqlOptions[0]
                .substring(1, sqlOptions[0].length - 1)
                .split(",")[0],
              10
            );
            options.scale = Number.parseInt(
              sqlOptions[0]
                .substring(1, sqlOptions[0].length - 1)
                .split(",")[1],
              10
            );
          }
          if (
            COLUMN_TYPES_WITH_LENGTH.some((v) => v === columnType) &&
            sqlOptions
          ) {
            options.length = Number.parseInt(
              sqlOptions[0].substring(1, sqlOptions[0].length - 1),
              10
            );
          }
          if (
            COLUMN_TYPES_WITH_WIDTH.some(
              (v) => v === columnType && tscType !== "boolean"
            ) &&
            sqlOptions
          ) {
            options.width = Number.parseInt(
              sqlOptions[0].substring(1, sqlOptions[0].length - 1),
              10
            );
          }

          ent.columns.push({
            generated,
            primary: isPrimary,
            type: columnType,
            default: defaultValue,
            options,
            tscName,
            tscType,
          });
        });
      })
    );

    return entities;
  }

  public async GetIndexesFromEntity(entities: Entity[]): Promise<Entity[]> {
    await Promise.all(
      entities.map(async (ent) => {
        const response = await this.runQuery<{
          seq: number;
          name: string;
          unique: number;
          origin: string;
          partial: number;
        }>(`PRAGMA index_list('${ent.name}');`);
        await Promise.all(
          response.map(async (resp) => {
            const indexColumnsResponse = await this.runQuery<{
              seqno: number;
              cid: number;
              name: string;
            }>(`PRAGMA index_info('${resp.name}');`);

            const indexInfo: Index = {
              name: resp.name,
              columns: [],
              options: {},
            };
            if (resp.unique === 1) indexInfo.options.unique = true;

            indexColumnsResponse.forEach((record) => {
              indexInfo.columns.push(record.name);
            });
            if (indexColumnsResponse.length === 1 && indexInfo.options.unique) {
              ent.columns
                .filter((v) => v.tscName === indexInfo.columns[0])
                .forEach((v) => {
                  // eslint-disable-next-line no-param-reassign
                  v.options.unique = true;
                });
            }
            ent.indices.push(indexInfo);
          })
        );
      })
    );

    return entities;
  }

  public async GetRelations(entities: Entity[]): Promise<Entity[]> {
    let retVal = entities;
    await Promise.all(
      retVal.map(async (entity) => {
        const response = await this.runQuery<{
          id: number;
          seq: number;
          table: string;
          from: string;
          to: string;
          // eslint-disable-next-line camelcase
          on_update: "RESTRICT" | "CASCADE" | "SET NULL" | "NO ACTION";
          // eslint-disable-next-line camelcase
          on_delete: "RESTRICT" | "CASCADE" | "SET NULL" | "NO ACTION";
          match: string;
        }>(`PRAGMA foreign_key_list('${entity.name}');`);

        const relationsTemp: RelationInternal[] = [] as RelationInternal[];
        const relationKeys = new Set(response.map((v) => v.id));

        relationKeys.forEach((relationId) => {
          const rows = response.filter((v) => v.id === relationId);
          const ownerTable = entities.find((v) => v.name === entity.name);
          const relatedTable = entities.find((v) => v.name === rows[0].table);
          if (!ownerTable || !relatedTable) {
            LogError(
              `Relation between tables ${entity.name} and ${rows[0].table} wasn't found in entity model.`
            );
            return;
          }
          const internal: RelationInternal = {
            ownerColumns: [],
            relatedColumns: [],
            ownerTable,
            relatedTable,
          };

          rows.forEach((row) => {
            internal.ownerColumns.push(row.from);
            internal.relatedColumns.push(row.to);
          });
          relationsTemp.push(internal);
        });

        retVal = SqliteDriver.GetRelationsFromRelationTempInfo(
          relationsTemp,
          retVal
        );
      })
    );
    return retVal;
  }

  // eslint-disable-next-line class-methods-use-this
  public async CheckIfDBExists(): Promise<boolean> {
    return true;
  }

  private static ReturnDefaultValueFunction(
    defVal: string | null
  ): string | undefined {
    if (!defVal) {
      return undefined;
    }

    return `() => "${defVal}"`;
  }
}
