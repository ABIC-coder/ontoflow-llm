import client from './client';
import type {
  ProcurementPlan,
  TenderProject,
  PurchaseContract,
  AcceptanceRecord
} from '../types/procurement';

export async function getProcurementPlans(): Promise<ProcurementPlan[]> {
  const res = await client.get('/api/procurement/plans');
  return res.data;
}

export async function getTenderProjects(): Promise<TenderProject[]> {
  const res = await client.get('/api/procurement/tenders');
  return res.data;
}

export async function getPurchaseContracts(): Promise<PurchaseContract[]> {
  const res = await client.get('/api/procurement/contracts');
  return res.data;
}

export async function getAcceptanceRecords(): Promise<AcceptanceRecord[]> {
  const res = await client.get('/api/procurement/acceptances');
  return res.data;
}
