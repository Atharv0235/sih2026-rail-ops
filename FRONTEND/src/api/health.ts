import type { SystemHealth } from '../types';

const API_BASE = 'http://localhost:8000';

export async function getConnectionHealth(): Promise<SystemHealth> {
  try {
    const response = await fetch(`${API_BASE}/api/health`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error('[Health API] Failed to fetch health:', error);
    // Return degraded status so UI shows the issue
    return {
      tms: 'down',
      smms: 'down',
      tdms: 'down',
      coa: 'down',
      last_synced: new Date().toISOString(),
    };
  }
}
