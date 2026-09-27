import type { BlockWindow, BlockScheduleQuery, PackedTask } from '../types';

const API_BASE = 'http://localhost:8000';

export async function getBlockSchedule(query: BlockScheduleQuery): Promise<BlockWindow[]> {
  try {
    const params = new URLSearchParams();
    params.set('view', query.view || 'weekly');
    if (query.corridor_key) {
      params.set('corridor_key', query.corridor_key);
    }
    if (query.status?.length) {
      params.set('status', query.status.join(','));
    }

    const response = await fetch(`${API_BASE}/api/blocks?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data: BlockWindow[] = await response.json();
    return data.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  } catch (error) {
    console.error('[Blocks API] Failed to fetch schedule:', error);
    return [];
  }
}

export async function approveBlock(id: string, user: string): Promise<BlockWindow> {
  const response = await fetch(`${API_BASE}/api/blocks/${id}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user }),
  });

  if (!response.ok) {
    throw new Error(`Failed to approve block: ${response.status}`);
  }

  return response.json();
}

export async function modifyBlock(id: string, newTasks: PackedTask[]): Promise<BlockWindow> {
  const response = await fetch(`${API_BASE}/api/blocks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newTasks),
  });

  if (!response.ok) {
    throw new Error(`Failed to modify block: ${response.status}`);
  }

  return response.json();
}

export async function runOptimizer(params: {
  corridor_key: string;
  date_start: string;
  date_end: string;
  max_block_duration_mins?: number;
  min_shadow_multiplier?: number;
}): Promise<any> {
  const response = await fetch(`${API_BASE}/api/optimize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Optimizer failed: ${detail}`);
  }

  return response.json();
}
