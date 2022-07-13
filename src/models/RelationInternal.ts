import { Entity } from "./Entity";

export type RelationInternal = {
  ownerTable: Entity;
  relatedTable: Entity;
  ownerColumns: string[];
  relatedColumns: string[];
};
