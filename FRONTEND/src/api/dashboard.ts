import type { KPIDashboard } from '../types';

const API_BASE = 'http://localhost:8000';

export async function getDashboardKPIs(): Promise<KPIDashboard> {
  try {
    const response = await fetch(`${API_BASE}/api/dashboard/kpis`);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('[Dashboard API] Failed to fetch KPIs:', error);
    // Return safe defaults so the UI doesn't break
    return {
      shadow_multiplier: 0,
      critical_defects_pending: 0,
      blocks_this_week: 0,
      downtime_saved_mtd_hours: 0,
      multiplier_trend: 0,
      defects_trend: 0,
      blocks_trend: 0,
      downtime_trend: 0,
    };
  }
}
