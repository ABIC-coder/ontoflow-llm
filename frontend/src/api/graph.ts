import client from './client';
import type { GraphStats, GraphNode, GraphEdge } from '../types/graph';

export async function getGraphStats(): Promise<GraphStats> {
  const res = await client.get('/api/graph/stats');
  return res.data;
}

export async function getGraphNodes(entityType?: string, limit?: number): Promise<GraphNode[]> {
  const params: Record<string, unknown> = {};
  if (entityType) params.entity_type = entityType;
  if (limit) params.limit = limit;
  const res = await client.get('/api/graph/nodes', { params });
  return res.data;
}

export async function getGraphEdges(relationType?: string, limit?: number): Promise<GraphEdge[]> {
  const params: Record<string, unknown> = {};
  if (relationType) params.relation_type = relationType;
  if (limit) params.limit = limit;
  const res = await client.get('/api/graph/edges', { params });
  return res.data;
}

export async function getEntity(nodeId: number): Promise<GraphNode | null> {
  const res = await client.get(`/api/graph/entity/${nodeId}`);
  return res.data;
}

export async function getEntityNeighbors(
  nodeId: number,
  direction: string = 'both',
  depth: number = 1
): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
  const res = await client.get(`/api/graph/entity/${nodeId}/neighbors`, {
    params: { direction, depth }
  });
  return res.data;
}

export async function searchGraph(keyword: string, entityType?: string): Promise<GraphNode[]> {
  const params: Record<string, unknown> = { keyword };
  if (entityType) params.entity_type = entityType;
  const res = await client.get('/api/graph/search', { params });
  return res.data;
}

export async function findPath(startId: number, endId: number, maxDepth?: number): Promise<{
  found: boolean;
  path: number[];
  edges: { source: number; target: number; relation: string }[];
  length: number;
}> {
  const params: Record<string, unknown> = { start_id: startId, end_id: endId };
  if (maxDepth) params.max_depth = maxDepth;
  const res = await client.get('/api/graph/path', { params });
  return res.data;
}

export async function getEquipmentLifecycle(equipmentId: number): Promise<Record<string, unknown>> {
  const res = await client.get(`/api/graph/equipment/${equipmentId}/lifecycle`);
  return res.data;
}

export async function getSupplyChain(equipmentId: number): Promise<Record<string, unknown>> {
  const res = await client.get(`/api/graph/equipment/${equipmentId}/supply-chain`);
  return res.data;
}

export async function getMaintenanceHistory(equipmentId: number): Promise<Record<string, unknown>> {
  const res = await client.get(`/api/graph/equipment/${equipmentId}/maintenance-history`);
  return res.data;
}

export async function rebuildGraph(): Promise<Record<string, unknown>> {
  const res = await client.post('/api/graph/rebuild');
  return res.data;
}

export async function syncGraph(): Promise<Record<string, unknown>> {
  const res = await client.post('/api/graph/sync');
  return res.data;
}
