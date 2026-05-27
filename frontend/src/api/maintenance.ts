import client from './client';
import type {
  FailureMode,
  MaintenancePlan,
  MaintenanceOrder,
  MaintenanceOrderDetail,
  SparePart,
  SupportResource
} from '../types/maintenance';

export async function getMaintenancePlans(): Promise<MaintenancePlan[]> {
  const res = await client.get('/api/maintenance/plans');
  return res.data;
}

export async function getMaintenanceOrders(): Promise<MaintenanceOrder[]> {
  const res = await client.get('/api/maintenance/orders');
  return res.data;
}

export async function getMaintenanceOrderDetail(orderId: number): Promise<MaintenanceOrderDetail> {
  const res = await client.get(`/api/maintenance/orders/${orderId}`);
  return res.data;
}

export async function getFailureModes(): Promise<FailureMode[]> {
  const res = await client.get('/api/maintenance/failure-modes');
  return res.data;
}

export async function getSpareParts(): Promise<SparePart[]> {
  const res = await client.get('/api/maintenance/spare-parts');
  return res.data;
}

export async function getSupportResources(): Promise<SupportResource[]> {
  const res = await client.get('/api/maintenance/resources');
  return res.data;
}
