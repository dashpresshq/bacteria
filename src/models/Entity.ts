import { Column } from "./Column";
import { Relation } from "./Relation";
import { Index } from "./Index";
import { RelationId } from "./RelationId";

export type Entity = {
  name: string;

  schema?: string;

  columns: Column[];
  relationIds: RelationId[];
  relations: Relation[];
  indices: Index[];
};
