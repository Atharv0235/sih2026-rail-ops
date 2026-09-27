import type { KPIDashboard } from '../types';
import { kpiDashboard } from '../mocks/kpi';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function getDashboardKPIs(): Promise<KPIDashboard> {
  // TODO(backend): replace mock with real endpoint
  await delay(400);
  return { ...kpiDashboard };
}
