import type { SystemHealth } from '../types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function getConnectionHealth(): Promise<SystemHealth> {
  // TODO(backend): replace with actual GET /api/health
  await delay(300);
  
  return {
    tms: 'connected',
    smms: 'connected',
    tdms: 'connected',
    coa: 'connected',
    last_synced: new Date().toISOString()
  };
}
