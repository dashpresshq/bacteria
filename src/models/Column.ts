export type Column = {
  tscType: string;
  tscName: string;
  type: string;
  isUsedInRelationAsOwner?: true;
  isUsedInRelationAsReferenced?: true;

  primary?: boolean;
  generated?: true | "increment" | "uuid";
  default?: string;
  options: {
    name: string;
    length?: number;
    width?: number;
    nullable?: boolean;
    unique?: boolean;
    precision?: number;
    scale?: number;
    unsigned?: boolean;
    enum?: string[];
    array?: boolean;
    comment?: string;
  };
};
