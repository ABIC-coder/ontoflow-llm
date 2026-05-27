export interface GraphNode {
  id: number;
  entity_type: string;
  source_table?: string;
  source_id?: number;
  label: string;
  properties_json?: string;
  properties?: Record<string, unknown>;
  data_hash?: string;
  depth?: number;
}

export interface GraphEdge {
  id: number;
  source_node_id: number;
  target_node_id: number;
  relation_type: string;
  properties_json?: string;
  depth?: number;
}

export interface GraphStats {
  node_count: number;
  edge_count: number;
  entity_types: Record<string, number>;
  relation_types?: Record<string, number>;
}

export interface GraphPath {
  found: boolean;
  path: number[];
  edges: { source: number; target: number; relation: string }[];
  length: number;
}

export interface NeighborResult {
  center_node_id: number;
  depth: number;
  nodes: GraphNode[];
  edges: GraphEdge[];
}
