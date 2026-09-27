import type { BlockWindow, BlockScheduleQuery, PackedTask } from '../types';
import { blocks as mockBlocks } from '../mocks/blocks';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Keep a mutable copy for the mock so updates persist in the session
let blocksState = [...mockBlocks];

export async function getBlockSchedule(query: BlockScheduleQuery): Promise<BlockWindow[]> {
  // TODO(backend): replace mock with real endpoint
  await delay(800);

  let result = blocksState.filter(b => b.view === query.view);

  if (query.corridor_key) {
    result = result.filter(b => b.corridor_key === query.corridor_key);
  }
  if (query.status?.length) {
    result = result.filter(b => query.status!.includes(b.status));
  }

  // Sort chronologically
  return result.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
}

export async function approveBlock(id: string, user: string): Promise<BlockWindow> {
  // TODO(backend): replace mock with real endpoint (POST /api/blocks/:id/approve)
  await delay(500);
  
  const blockIndex = blocksState.findIndex(b => b.id === id);
  if (blockIndex === -1) throw new Error('Block not found');

  const updated = {
    ...blocksState[blockIndex],
    status: 'approved' as const,
    approved_by: user,
    approved_at: new Date().toISOString()
  };
  
  blocksState[blockIndex] = updated;
  return updated;
}

export async function modifyBlock(id: string, newTasks: PackedTask[]): Promise<BlockWindow> {
  // TODO(backend): replace mock with real endpoint
  await delay(600);

  const blockIndex = blocksState.findIndex(b => b.id === id);
  if (blockIndex === -1) throw new Error('Block not found');

  const updated = {
    ...blocksState[blockIndex],
    packed_tasks: newTasks,
    status: 'modified' as const
  };
  
  blocksState[blockIndex] = updated;
  return updated;
}

// Used by live feed to inject opportunistic blocks
export function injectMockOpportunisticBlock(block: BlockWindow) {
  blocksState.push(block);
}
