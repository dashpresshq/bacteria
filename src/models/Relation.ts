// import { JoinColumnOptions, RelationOptions } from "typeorm";
// import { JoinTableMultipleColumnsOptions } from "typeorm/decorator/options/JoinTableMultipleColumnsOptions";

export type Relation = {
  relationType: "OneToOne" | "OneToMany" | "ManyToOne" | "ManyToMany";
  relatedTable: string;
  relatedField: string;
  fieldName: string;
  relationOptions?: any; // RelationOptions;
  joinColumnOptions?: any; // Required<JoinColumnOptions>[];
  joinTableOptions?: any; // JoinTableMultipleColumnsOptions;
};
