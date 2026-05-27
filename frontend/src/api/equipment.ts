import client from './client';
import type { Equipment, EquipmentRisk, RiskSummary } from '../types/equipment';

export async function getEquipments(): Promise<Equipment[]> {
  const res = await client.get('/api/equipment');
  return res.data;
}

export async function getEquipmentRisks(): Promise<EquipmentRisk[]> {
  const res = await client.get('/api/equipment/risks');
  return res.data;
}

export async function getEquipmentRisk(equipmentId: number): Promise<EquipmentRisk> {
  const res = await client.get(`/api/equipment/${equipmentId}/risk`);
  return res.data;
}

export async function getRiskSummary(): Promise<RiskSummary> {
  const res = await client.get('/api/equipment/risk-summary');
  return res.data;
}
