import type { DelayEvent, BlockWindow } from '../types';

const API_BASE = 'http://localhost:8000';
const WS_BASE = 'ws://localhost:8000';

// WebSocket connection for real-time push
let ws: WebSocket | null = null;
let wsListeners: Array<(events: DelayEvent[]) => void> = [];

export function connectLiveWebSocket(onUpdate: (events: DelayEvent[]) => void): () => void {
  wsListeners.push(onUpdate);

  if (!ws || ws.readyState === WebSocket.CLOSED) {
    ws = new WebSocket(`${WS_BASE}/api/live/ws`);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'initial') {
          wsListeners.forEach(cb => cb(data.events));
        } else if (data.type === 'event_accepted' || data.type === 'event_dismissed' || data.type === 'event_reopened') {
          // Refresh on any update
          getLiveOpportunities().then(events => {
            wsListeners.forEach(cb => cb(events));
          });
        }
      } catch (e) {
        console.error('[Live WS] Parse error:', e);
      }
    };

    ws.onclose = () => {
      console.log('[Live WS] Disconnected, will retry in 5s');
      setTimeout(() => {
        if (wsListeners.length > 0) {
          connectLiveWebSocket(onUpdate);
        }
      }, 5000);
    };

    ws.onerror = (e) => {
      console.error('[Live WS] Error:', e);
    };

    // Keepalive ping every 30s
    const pingInterval = setInterval(() => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send('ping');
      } else {
        clearInterval(pingInterval);
      }
    }, 30000);
  }

  // Return cleanup function
  return () => {
    wsListeners = wsListeners.filter(cb => cb !== onUpdate);
    if (wsListeners.length === 0 && ws) {
      ws.close();
      ws = null;
    }
  };
}

// REST fallback
export async function getLiveOpportunities(): Promise<DelayEvent[]> {
  try {
    const response = await fetch(`${API_BASE}/api/live`);
    if (!response.ok) throw new Error(`API error: ${response.status}`);

    const data: DelayEvent[] = await response.json();
    return data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } catch (error) {
    console.error('[Live API] Failed to fetch opportunities:', error);
    return [];
  }
}

export async function acceptOpportunity(id: string): Promise<DelayEvent> {
  const response = await fetch(`${API_BASE}/api/live/${id}/accept`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error(`Failed to accept: ${response.status}`);
  return response.json();
}

export async function dismissOpportunity(id: string): Promise<DelayEvent> {
  const response = await fetch(`${API_BASE}/api/live/${id}/dismiss`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error(`Failed to dismiss: ${response.status}`);
  return response.json();
}

export async function undoDismiss(id: string): Promise<DelayEvent> {
  const response = await fetch(`${API_BASE}/api/live/${id}/undo`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error(`Failed to undo: ${response.status}`);
  return response.json();
}

// Reschedule API
export async function triggerReschedule(params: {
  train_id: string;
  train_name?: string;
  delay_mins: number;
  section_id: string;
  planned_time_mins?: number;
}): Promise<any> {
  const response = await fetch(`${API_BASE}/api/reschedule`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!response.ok) throw new Error(`Reschedule failed: ${response.status}`);
  return response.json();
}
