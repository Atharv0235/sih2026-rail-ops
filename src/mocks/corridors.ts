import type { CorridorSection } from '../types';

// Three selectable corridors: GWL-JHS, BPL-ET, Pune-Mumbai
export const corridors: CorridorSection[] = [
  // === GWL-JHS (Gwalior to Jhansi) — North Central Railway ===
  {
    id: 'GWL-JHS-01',
    name: 'Gwalior Jn – Dabra',
    from_station: 'Gwalior Jn',
    to_station: 'Dabra',
    line: 'BOTH',
    length_km: 42,
    division: 'Jhansi',
  },
  {
    id: 'GWL-JHS-02',
    name: 'Dabra – Datia',
    from_station: 'Dabra',
    to_station: 'Datia',
    line: 'BOTH',
    length_km: 28,
    division: 'Jhansi',
  },
  {
    id: 'GWL-JHS-03',
    name: 'Datia – Jhansi Jn',
    from_station: 'Datia',
    to_station: 'Jhansi Jn',
    line: 'BOTH',
    length_km: 31,
    division: 'Jhansi',
  },

  // === BPL-ET (Bhopal to Itarsi) — West Central Railway ===
  {
    id: 'BPL-ET-01',
    name: 'Bhopal Jn – Hoshangabad',
    from_station: 'Bhopal Jn',
    to_station: 'Hoshangabad',
    line: 'BOTH',
    length_km: 68,
    division: 'Bhopal',
  },
  {
    id: 'BPL-ET-02',
    name: 'Hoshangabad – Itarsi Jn',
    from_station: 'Hoshangabad',
    to_station: 'Itarsi Jn',
    line: 'BOTH',
    length_km: 22,
    division: 'Bhopal',
  },
  {
    id: 'BPL-ET-03',
    name: 'Bhopal Jn – Habibganj',
    from_station: 'Bhopal Jn',
    to_station: 'Habibganj',
    line: 'UP',
    length_km: 6,
    division: 'Bhopal',
  },

  // === PUNE-MUM (Pune to Mumbai) — Central Railway ===
  {
    id: 'PUNE-MUM-01',
    name: 'Pune Jn – Lonavala',
    from_station: 'Pune Jn',
    to_station: 'Lonavala',
    line: 'BOTH',
    length_km: 62,
    division: 'Pune',
  },
  {
    id: 'PUNE-MUM-02',
    name: 'Lonavala – Kalyan Jn',
    from_station: 'Lonavala',
    to_station: 'Kalyan Jn',
    line: 'BOTH',
    length_km: 52,
    division: 'Mumbai',
  },
  {
    id: 'PUNE-MUM-03',
    name: 'Kalyan Jn – CSMT',
    from_station: 'Kalyan Jn',
    to_station: 'CSMT Mumbai',
    line: 'BOTH',
    length_km: 54,
    division: 'Mumbai',
  },
];

// Helper: corridor key → sections
export const CORRIDOR_KEYS = ['GWL-JHS', 'BPL-ET', 'PUNE-MUM'] as const;
export type CorridorKey = typeof CORRIDOR_KEYS[number];

export const CORRIDOR_NAMES: Record<CorridorKey, string> = {
  'GWL-JHS': 'Gwalior – Jhansi',
  'BPL-ET': 'Bhopal – Itarsi',
  'PUNE-MUM': 'Pune – Mumbai',
};

export function getSectionsByCorridorKey(key: CorridorKey): CorridorSection[] {
  return corridors.filter(c => c.id.startsWith(key));
}
