export interface OntologyEntity {
  name: string;
  type?: string;
  label?: string;
  properties?: string[];
  source_table?: string;
  label_expr?: string;
  property_mappings?: Record<string, string>;
}

export interface OntologyRelation {
  name: string;
  source: string;
  target: string;
  label?: string;
  join?: {
    source_field: string;
    target_field: string;
  };
  join_type?: string;
  through?: string;
}

export interface OntologySchema {
  name?: string;
  version?: string;
  description?: string;
  entities?: OntologyEntity[];
  relations?: OntologyRelation[];
  rules?: Record<string, unknown>[];
  [key: string]: unknown;
}

export interface OntologySchemaResponse {
  name: string;
  version?: string;
  schema: OntologySchema;
  created_at?: string | null;
}
