import client from './client';
import type {
  TestProject,
  TestData,
  AppraisalConclusion,
  TestProjectDetail
} from '../types/testing';

export async function getTestProjects(): Promise<TestProject[]> {
  const res = await client.get('/api/testing/projects');
  return res.data;
}

export async function getTestProjectDetail(projectId: number): Promise<TestProjectDetail> {
  const res = await client.get(`/api/testing/projects/${projectId}`);
  return res.data;
}

export async function getTestData(projectId?: number): Promise<TestData[]> {
  const params: Record<string, unknown> = {};
  if (projectId) params.project_id = projectId;
  const res = await client.get('/api/testing/data', { params });
  return res.data;
}

export async function getAppraisalConclusions(): Promise<AppraisalConclusion[]> {
  const res = await client.get('/api/testing/conclusions');
  return res.data;
}
