/* eslint-disable no-plusplus */
/* eslint-disable no-param-reassign */
import * as changeCase from "change-case";
import { LogError } from "../utils";
import { Entity } from "../models/Entity";
import { RelationInternal } from "../models/RelationInternal";
import { Relation } from "../models/Relation";
import { Column } from "../models/Column";
import { IConnectionOptions } from "../types";

export default abstract class AbstractDriver {
  public ColumnTypesWithWidth: string[] = [
    "tinyint",
    "smallint",
    "mediumint",
    "int",
    "bigint",
  ];

  public ColumnTypesWithPrecision: string[] = [
    "float",
    "double",
    "dec",
    "decimal",
    "numeric",
    "real",
    "double precision",
    "number",
    "datetime",
    "datetime2",
    "datetimeoffset",
    "time",
    "time with time zone",
    "time without time zone",
    "timestamp",
    "timestamp without time zone",
    "timestamp with time zone",
    "timestamp with local time zone",
  ];

  public ColumnTypesWithLength: string[] = [
    "character varying",
    "varying character",
    "nvarchar",
    "character",
    "native character",
    "varchar",
    "char",
    "nchar",
    "varchar2",
    "nvarchar2",
    "raw",
    "binary",
    "varbinary",
  ];

  public static FindManyToManyRelations(dbModel: Entity[]) {
    let retVal = dbModel;
    const manyToManyEntities = retVal.filter(
      (entity) =>
        entity.relations.length === 2 &&
        entity.relations.every(
          (v) => v.joinColumnOptions && v.relationType !== "ManyToMany"
        ) &&
        entity.relations[0].relatedTable !== entity.relations[1].relatedTable &&
        entity.relations[0].joinColumnOptions!.length ===
          entity.relations[1].joinColumnOptions!.length &&
        entity.columns.length ===
          entity.columns.filter((c) => c.primary).length &&
        entity.columns
          .map((v) => v.tscName)
          .filter(
            (v) =>
              !entity.relations[0]
                .joinColumnOptions!.map((x: { name: string }) => x.name)
                .some((jc: string) => jc === v) &&
              !entity.relations[1]
                .joinColumnOptions!.map((x: { name: string }) => x.name)
                .some((jc: string) => jc === v)
          ).length === 0
    );
    manyToManyEntities.forEach((junctionEntity) => {
      const firstEntity = dbModel.find(
        (v) => v.name === junctionEntity.relations[0].relatedTable
      )!;
      const secondEntity = dbModel.find(
        (v) => v.name === junctionEntity.relations[1].relatedTable
      )!;

      const firstRelation = firstEntity.relations.find(
        (v) => v.relatedTable === junctionEntity.name
      )!;
      const secondRelation = secondEntity.relations.find(
        (v) => v.relatedTable === junctionEntity.name
      )!;

      firstRelation.relationType = "ManyToMany";
      secondRelation.relationType = "ManyToMany";
      firstRelation.relatedTable = secondEntity.name;
      secondRelation.relatedTable = firstEntity.name;

      firstRelation.fieldName = AbstractDriver.findNameForNewField(
        secondEntity.name,
        firstEntity
      );
      secondRelation.fieldName = AbstractDriver.findNameForNewField(
        firstEntity.name,
        secondEntity
      );
      firstRelation.relatedField = secondRelation.fieldName;
      secondRelation.relatedField = firstRelation.fieldName;

      firstRelation.joinTableOptions = {
        name: junctionEntity.name,
        joinColumns: junctionEntity.relations[0].joinColumnOptions!.map(
          (v: { referencedColumnName: string }, i: number) => {
            return {
              referencedColumnName: v.referencedColumnName,
              name: junctionEntity.relations[0].joinColumnOptions![i].name,
            };
          }
        ),
        inverseJoinColumns: junctionEntity.relations[1].joinColumnOptions!.map(
          (v: { referencedColumnName: string }, i: number) => {
            return {
              referencedColumnName: v.referencedColumnName,
              name: junctionEntity.relations[1].joinColumnOptions![i].name,
            };
          }
        ),
      };
      if (junctionEntity.schema) {
        firstRelation.joinTableOptions.schema = junctionEntity.schema;
      }

      firstRelation.relationOptions = undefined;
      secondRelation.relationOptions = undefined;
      firstRelation.joinColumnOptions = undefined;
      secondRelation.joinColumnOptions = undefined;
      retVal = retVal.filter((ent) => {
        return ent.name !== junctionEntity.name;
      });
    });
    return retVal;
  }

  public async GetDataFromServer(
    connectionOptions: IConnectionOptions
  ): Promise<Entity[]> {
    let dbModel = [] as Entity[];
    await this.ConnectToServer(connectionOptions);
    dbModel = await this.GetAllTables(
      connectionOptions.schemaNames,
      connectionOptions.database
    );
    await this.GetCoulmnsFromEntity(
      dbModel,
      connectionOptions.schemaNames,
      connectionOptions.database
    );
    await this.GetIndexesFromEntity(
      dbModel,
      connectionOptions.schemaNames,
      connectionOptions.database
    );
    AbstractDriver.FindPrimaryColumnsFromIndexes(dbModel);
    dbModel = await this.GetRelations(
      dbModel,
      connectionOptions.schemaNames,
      connectionOptions.database
    );
    await this.DisconnectFromServer();
    dbModel = AbstractDriver.FindManyToManyRelations(dbModel);
    return dbModel;
  }

  public abstract ConnectToServer(
    connectionOptons: IConnectionOptions
  ): Promise<void>;

  public abstract GetAllTables(
    schemas: string[],
    dbName: string
  ): Promise<Entity[]>;

  public static GetRelationsFromRelationTempInfo(
    relationsTemp: RelationInternal[],
    entities: Entity[]
  ) {
    relationsTemp.forEach((relationTmp) => {
      const ownerEntity = entities.find(
        (entity) => entity.name === relationTmp.ownerTable.name
      );
      if (!ownerEntity) {
        LogError(
          `Relation between tables ${relationTmp.ownerTable.name} and ${relationTmp.relatedTable.name} didn't found entity model ${relationTmp.ownerTable.name}.`
        );
        return;
      }
      const referencedEntity = entities.find(
        (entity) => entity.name === relationTmp.relatedTable.name
      );
      if (!referencedEntity) {
        LogError(
          `Relation between tables ${relationTmp.ownerTable.name} and ${relationTmp.relatedTable.name} didn't found entity model ${relationTmp.relatedTable.name}.`
        );
        return;
      }

      const ownerColumns: Column[] = [];
      const relatedColumns: Column[] = [];
      for (
        let relationColumnIndex = 0;
        relationColumnIndex < relationTmp.ownerColumns.length;
        relationColumnIndex++
      ) {
        const ownerColumn = ownerEntity.columns.find(
          (column) =>
            column.tscName === relationTmp.ownerColumns[relationColumnIndex]
        );
        if (!ownerColumn) {
          LogError(
            `Relation between tables ${relationTmp.ownerTable.name} and ${relationTmp.relatedTable.name} didn't found entity column ${relationTmp.ownerTable.name}.${ownerColumn}.`
          );
          return;
        }
        const relatedColumn = referencedEntity.columns.find(
          (column) =>
            column.tscName === relationTmp.relatedColumns[relationColumnIndex]
        );
        if (!relatedColumn) {
          LogError(
            `Relation between tables ${relationTmp.ownerTable.name} and ${relationTmp.relatedTable.name} didn't found entity column ${relationTmp.relatedTable.name}.${relatedColumn}.`
          );
          return;
        }
        ownerColumns.push(ownerColumn);
        relatedColumns.push(relatedColumn);
      }
      let isOneToMany: boolean;
      isOneToMany = false;
      const index = ownerEntity.indices.find(
        (ind) =>
          ind.options.unique &&
          ind.columns.length === ownerColumns.length &&
          ownerColumns.every((ownerColumn) =>
            ind.columns.some((col) => col === ownerColumn.tscName)
          )
      );
      isOneToMany = !index;

      ownerColumns.forEach((column) => {
        column.isUsedInRelationAsOwner = true;
      });
      relatedColumns.forEach((column) => {
        column.isUsedInRelationAsReferenced = true;
      });
      let fieldName = "";
      if (ownerColumns.length === 1) {
        fieldName = AbstractDriver.findNameForNewField(
          ownerColumns[0].tscName,
          ownerEntity
        );
      } else {
        fieldName = AbstractDriver.findNameForNewField(
          relationTmp.relatedTable.name,
          ownerEntity
        );
      }

      const ownerRelation: Relation = {
        fieldName,
        relatedField: AbstractDriver.findNameForNewField(
          relationTmp.ownerTable.name,
          relationTmp.relatedTable
        ),
        joinColumnOptions: relationTmp.ownerColumns.map((v, idx) => {
          const retVal = {
            name: v,
            referencedColumnName: relationTmp.relatedColumns[idx],
          };
          return retVal;
        }),
        relatedTable: relationTmp.relatedTable.name,
        relationType: isOneToMany ? "ManyToOne" : "OneToOne",
      };

      const relatedRelation: Relation = {
        fieldName: ownerRelation.relatedField,
        relatedField: ownerRelation.fieldName,
        relatedTable: relationTmp.ownerTable.name,
        relationType: isOneToMany ? "OneToMany" : "OneToOne",
      };

      ownerEntity.relations.push(ownerRelation);
      relationTmp.relatedTable.relations.push(relatedRelation);

      if (ownerColumns.length === 1) {
        let relationIdFieldName = "";
        relationIdFieldName = AbstractDriver.findNameForNewField(
          ownerColumns[0].tscName,
          ownerEntity
        );

        let fieldType = "";
        if (ownerRelation.relationType === "OneToMany") {
          fieldType = `${ownerColumns[0].tscType}[]`;
        } else {
          fieldType = ownerColumns[0].tscType;
          if (ownerColumns[0].options.nullable) {
            fieldType += " | null";
          }
        }

        ownerEntity.relationIds.push({
          fieldName: relationIdFieldName,
          fieldType,
          relationField: ownerRelation.fieldName,
        });
      }
    });
    return entities;
  }

  public abstract GetCoulmnsFromEntity(
    entities: Entity[],
    schemas: string[],
    dbNames: string
  ): Promise<Entity[]>;

  public abstract GetIndexesFromEntity(
    entities: Entity[],
    schemas: string[],
    dbNames: string
  ): Promise<Entity[]>;

  public abstract GetRelations(
    entities: Entity[],
    schemas: string[],
    dbNames: string
  ): Promise<Entity[]>;

  public static findNameForNewField(
    _fieldName: string,
    entity: Entity,
    columnOldName = ""
  ): string {
    let fieldName = _fieldName;
    const validNameCondition = () =>
      (entity.columns.every(
        (v) =>
          changeCase.camelCase(v.tscName) !== changeCase.camelCase(fieldName)
      ) &&
        entity.relations.every(
          (v) =>
            changeCase.camelCase(v.fieldName) !==
            changeCase.camelCase(fieldName)
        ) &&
        entity.relationIds.every(
          (v) =>
            changeCase.camelCase(v.fieldName) !==
            changeCase.camelCase(fieldName)
        )) ||
      (columnOldName &&
        changeCase.camelCase(columnOldName) ===
          changeCase.camelCase(fieldName));
    if (!validNameCondition()) {
      fieldName += "_";
      for (
        let i = 2;
        i <= entity.columns.length + entity.relations.length;
        i++
      ) {
        fieldName =
          fieldName.substring(0, fieldName.length - i.toString().length) +
          i.toString();
        if (validNameCondition()) {
          break;
        }
      }
    }
    return fieldName;
  }

  public static FindPrimaryColumnsFromIndexes(dbModel: Entity[]) {
    dbModel.forEach((entity) => {
      const primaryIndex = entity.indices.find((v) => v.primary);
      entity.columns
        .filter(
          (col) =>
            primaryIndex &&
            primaryIndex.columns.some((cIndex) => cIndex === col.tscName)
        )
        .forEach((col) => {
          // eslint-disable-next-line no-param-reassign
          col.primary = true;
          if (col.options.unique) {
            delete col.options.unique;
          }
        });
      if (
        !entity.columns.some((v) => {
          return !!v.primary;
        })
      ) {
        LogError(`Table ${entity.name} has no PK.`, false);
      }
    });
  }

  public abstract DisconnectFromServer(): Promise<void>;

  public abstract CheckIfDBExists(dbName: string): Promise<boolean>;

  protected static buildEscapedObjectList(dbNames: string[]) {
    return `'${dbNames.join("','")}'`;
  }
}
