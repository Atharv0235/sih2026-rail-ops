import type { Defect, BacklogFilters } from '../types';

const API_BASE = 'http://localhost:8000';

export async function getBacklog(filters?: BacklogFilters): Promise<Defect[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.departments?.length) {
      params.set('departments', filters.departments.join(','));
    }
    if (filters?.corridor_section_id) {
      params.set('corridor_section_id', filters.corridor_section_id);
    }
    if (filters?.urgency?.length) {
      params.set('urgency', filters.urgency.join(','));
    }
    if (filters?.status?.length) {
      params.set('status', filters.status.join(','));
    }
    if (filters?.search) {
      params.set('search', filters.search);
    }

    const url = `${API_BASE}/api/defects?${params.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data: Defect[] = await response.json();
    // Default sort by criticality (descending)
    return data.sort((a, b) => b.criticality.overall - a.criticality.overall);
  } catch (error) {
    console.error('[Backlog API] Failed to fetch defects:', error);
    return [];
  }
}

export async function getDefectById(id: string): Promise<Defect | null> {
  try {
    const response = await fetch(`${API_BASE}/api/defects`);
    if (!response.ok) return null;

    const data: Defect[] = await response.json();
    return data.find(d => d.id === id) || null;
  } catch (error) {
    console.error('[Backlog API] Failed to fetch defect:', error);
    return null;
  }
}
