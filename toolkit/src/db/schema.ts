export interface TableColumn {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: string | null;
  pk: number;
}

export interface TableIndex {
  name: string;
  unique: number;
  origin: string;
  partial: number;
  sql: string | null;
}

export interface TableForeignKey {
  id: number;
  seq: number;
  table: string;
  from: string;
  to: string;
  on_update: string;
  on_delete: string;
  match: string;
}

export interface TableSchema {
  table: string;
  kind: "catalog" | "runtime";
  sql: string | null;
  columns: TableColumn[];
  indexes: TableIndex[];
  fks: TableForeignKey[];
}
