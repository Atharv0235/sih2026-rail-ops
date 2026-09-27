import type { DelayEvent, BlockWindow } from '../types';
import { delayEvents as mockDelayEvents } from '../mocks/delays';
import { injectMockOpportunisticBlock } from './blocks';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Keep a mutable state for the session
let liveEventsState = [...mockDelayEvents];

export async function getLiveOpportunities(): Promise<DelayEvent[]> {
  // TODO(backend): replace mock polling with real WebSocket/SSE connection
  await delay(300);
  // Only return open events or recently dismissed/accepted ones (for the undo toast or animations)
  return liveEventsState.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function acceptOpportunity(id: string): Promise<DelayEvent> {
  // TODO(backend): replace with POST /api/live/:id/accept
  await delay(400);
  
  const eventIndex = liveEventsState.findIndex(e => e.id === id);
  if (eventIndex === -1) throw new Error('Event not found');

  const updated = {
    ...liveEventsState[eventIndex],
    status: 'accepted' as const,
    accepted_at: new Date().toISOString()
  };
  
  liveEventsState[eventIndex] = updated;

  // Simulate the backend adding this block to the schedule
  const newBlock: BlockWindow = {
    id: `BLK-OPP-${Date.now()}`,
    corridor_section_id: updated.corridor_section_id,
    corridor_section_name: updated.corridor_section_name,
    corridor_key: updated.corridor_key,
    start_time: updated.window_start,
    end_time: new Date(new Date(updated.window_start).getTime() + updated.window_opened_mins * 60000).toISOString(),
    duration_mins: updated.window_opened_mins,
    packed_tasks: updated.suggested_tasks,
    shadow_multiplier: updated.suggested_tasks.length, // simple mock math
    status: 'pending',
    view: 'weekly',
    is_opportunistic: true
  };
  
  injectMockOpportunisticBlock(newBlock);

  return updated;
}

export async function dismissOpportunity(id: string): Promise<DelayEvent> {
  // TODO(backend): replace with POST /api/live/:id/dismiss
  await delay(300);
  
  const eventIndex = liveEventsState.findIndex(e => e.id === id);
  if (eventIndex === -1) throw new Error('Event not found');

  const updated = {
    ...liveEventsState[eventIndex],
    status: 'dismissed' as const,
    dismissed_at: new Date().toISOString()
  };
  
  liveEventsState[eventIndex] = updated;
  return updated;
}

export async function undoDismiss(id: string): Promise<DelayEvent> {
  // TODO(backend): replace with POST /api/live/:id/undo
  await delay(200);
  const eventIndex = liveEventsState.findIndex(e => e.id === id);
  if (eventIndex === -1) throw new Error('Event not found');

  const updated = {
    ...liveEventsState[eventIndex],
    status: 'open' as const,
    dismissed_at: undefined
  };
  
  liveEventsState[eventIndex] = updated;
  return updated;
}
