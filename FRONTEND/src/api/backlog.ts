import type { Defect, BacklogFilters } from '../types';
import { defects as mockDefects } from '../mocks/defects';

// Simulate network latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function getBacklog(filters?: BacklogFilters): Promise<Defect[]> {
  // TODO(backend): replace mock with real endpoint
  // const queryParams = new URLSearchParams(...);
  // const response = await fetch(`/api/defects?${queryParams}`);
  // return response.json();

  await delay(600); // artificial latency

  let result = [...mockDefects];

  if (filters) {
    if (filters.departments?.length) {
      result = result.filter(d => filters.departments!.includes(d.department));
    }
    if (filters.corridor_section_id) {
      result = result.filter(d => d.corridor_section_id === filters.corridor_section_id);
    }
    if (filters.urgency?.length) {
      result = result.filter(d => filters.urgency!.includes(d.severity));
    }
    if (filters.status?.length) {
      result = result.filter(d => filters.status!.includes(d.status));
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(d => 
        d.id.toLowerCase().includes(q) || 
        d.description.toLowerCase().includes(q) ||
        d.defect_type.toLowerCase().includes(q)
      );
    }
  }

  // Default sort by criticality (descending)
  return result.sort((a, b) => b.criticality.overall - a.criticality.overall);
}

export async function getDefectById(id: string): Promise<Defect | null> {
  // TODO(backend): replace mock with real endpoint
  await delay(300);
  return mockDefects.find(d => d.id === id) || null;
}
