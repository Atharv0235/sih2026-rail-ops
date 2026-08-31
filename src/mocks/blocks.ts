import type { BlockWindow } from '../types';

// Helper to create dates relative to "this week"
function weekDate(dayOffset: number, hour: number, minute: number = 0): string {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - now.getDay() + 1); // Monday
  monday.setHours(hour, minute, 0, 0);
  monday.setDate(monday.getDate() + dayOffset);
  return monday.toISOString();
}

function addMins(iso: string, mins: number): string {
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() + mins);
  return d.toISOString();
}

export const blocks: BlockWindow[] = [
  // === GWL-JHS Corridor Blocks ===
  {
    id: 'BLK-GWL-001',
    corridor_section_id: 'GWL-JHS-01',
    corridor_section_name: 'Gwalior Jn – Dabra',
    corridor_key: 'GWL-JHS',
    start_time: weekDate(0, 9),  // Monday 9 AM
    end_time: addMins(weekDate(0, 9), 180),
    duration_mins: 180,
    packed_tasks: [
      { defect_id: 'TRK-001', department: 'TMS', description: 'Weld fracture repair at km 12.4', est_duration_mins: 120, criticality_score: 95, sequence_order: 1 },
      { defect_id: 'SIG-001', department: 'SMMS', description: 'Point machine overhaul — No.5 turnout', est_duration_mins: 100, criticality_score: 88, sequence_order: 2 },
      { defect_id: 'OHE-001', department: 'TDMS', description: 'Catenary wire height correction at km 12.4', est_duration_mins: 110, criticality_score: 90, sequence_order: 3 },
    ],
    shadow_multiplier: 2.75,
    status: 'pending',
    view: 'weekly',
    is_opportunistic: false,
  },
  {
    id: 'BLK-GWL-002',
    corridor_section_id: 'GWL-JHS-02',
    corridor_section_name: 'Dabra – Datia',
    corridor_key: 'GWL-JHS',
    start_time: weekDate(1, 14),  // Tuesday 2 PM
    end_time: addMins(weekDate(1, 14), 150),
    duration_mins: 150,
    packed_tasks: [
      { defect_id: 'TRK-007', department: 'TMS', description: 'Bridge approach slab settlement repair', est_duration_mins: 140, criticality_score: 92, sequence_order: 1 },
      { defect_id: 'SIG-004', department: 'SMMS', description: 'Relay room battery bank replacement', est_duration_mins: 120, criticality_score: 74, sequence_order: 2 },
    ],
    shadow_multiplier: 1.86,
    status: 'approved',
    view: 'weekly',
    is_opportunistic: false,
    approved_by: 'Chief Controller - Jhansi',
    approved_at: '2026-08-26T10:00:00Z',
  },
  {
    id: 'BLK-GWL-003',
    corridor_section_id: 'GWL-JHS-03',
    corridor_section_name: 'Datia – Jhansi Jn',
    corridor_key: 'GWL-JHS',
    start_time: weekDate(3, 10),  // Thursday 10 AM
    end_time: addMins(weekDate(3, 10), 120),
    duration_mins: 120,
    packed_tasks: [
      { defect_id: 'OHE-004', department: 'TDMS', description: 'Dropper wire repair on UP line', est_duration_mins: 45, criticality_score: 93, sequence_order: 1 },
      { defect_id: 'TRK-004', department: 'TMS', description: 'LC gate timber replacement', est_duration_mins: 60, criticality_score: 78, sequence_order: 2 },
      { defect_id: 'SIG-007', department: 'SMMS', description: 'LC gate boom motor replacement', est_duration_mins: 90, criticality_score: 56, sequence_order: 3 },
    ],
    shadow_multiplier: 2.17,
    status: 'pending',
    view: 'weekly',
    is_opportunistic: false,
  },

  // === BPL-ET Corridor Blocks ===
  {
    id: 'BLK-BPL-001',
    corridor_section_id: 'BPL-ET-01',
    corridor_section_name: 'Bhopal Jn – Hoshangabad',
    corridor_key: 'BPL-ET',
    start_time: weekDate(0, 11),  // Monday 11 AM
    end_time: addMins(weekDate(0, 11), 210),
    duration_mins: 210,
    packed_tasks: [
      { defect_id: 'SIG-002', department: 'SMMS', description: 'Signal cable fault repair km 49-51', est_duration_mins: 150, criticality_score: 91, sequence_order: 1 },
      { defect_id: 'TRK-002', department: 'TMS', description: 'Rail joint gap — fishplate renewal', est_duration_mins: 90, criticality_score: 82, sequence_order: 2 },
      { defect_id: 'OHE-002', department: 'TDMS', description: 'ATD malfunction — tension adjustment', est_duration_mins: 90, criticality_score: 75, sequence_order: 3 },
    ],
    shadow_multiplier: 3.0,
    status: 'pending',
    view: 'weekly',
    is_opportunistic: false,
  },
  {
    id: 'BLK-BPL-002',
    corridor_section_id: 'BPL-ET-02',
    corridor_section_name: 'Hoshangabad – Itarsi Jn',
    corridor_key: 'BPL-ET',
    start_time: weekDate(2, 9, 30),  // Wednesday 9:30 AM
    end_time: addMins(weekDate(2, 9, 30), 180),
    duration_mins: 180,
    packed_tasks: [
      { defect_id: 'OHE-006', department: 'TDMS', description: 'Section insulator replacement at Itarsi', est_duration_mins: 100, criticality_score: 77, sequence_order: 1 },
      { defect_id: 'TRK-005', department: 'TMS', description: 'Track geometry correction (cross-level)', est_duration_mins: 150, criticality_score: 58, sequence_order: 2 },
      { defect_id: 'SIG-006', department: 'SMMS', description: 'Axle counter reset at Itarsi outer', est_duration_mins: 60, criticality_score: 60, sequence_order: 3 },
    ],
    shadow_multiplier: 2.33,
    status: 'approved',
    view: 'weekly',
    is_opportunistic: false,
    approved_by: 'Chief Controller - Bhopal',
    approved_at: '2026-08-25T14:00:00Z',
  },

  // === PUNE-MUM Corridor Blocks ===
  {
    id: 'BLK-PUN-001',
    corridor_section_id: 'PUNE-MUM-02',
    corridor_section_name: 'Lonavala – Kalyan Jn',
    corridor_key: 'PUNE-MUM',
    start_time: weekDate(1, 10),  // Tuesday 10 AM
    end_time: addMins(weekDate(1, 10), 240),
    duration_mins: 240,
    packed_tasks: [
      { defect_id: 'OHE-003', department: 'TDMS', description: 'Insulator replacement — mast #287', est_duration_mins: 60, criticality_score: 79, sequence_order: 1 },
      { defect_id: 'TRK-003', department: 'TMS', description: 'Ballast tamping in ghat section', est_duration_mins: 180, criticality_score: 62, sequence_order: 2 },
      { defect_id: 'SIG-003', department: 'SMMS', description: 'Signal lamp LED replacement — D-147', est_duration_mins: 45, criticality_score: 55, sequence_order: 3 },
    ],
    shadow_multiplier: 2.5,
    status: 'pending',
    view: 'weekly',
    is_opportunistic: false,
  },
  {
    id: 'BLK-PUN-002',
    corridor_section_id: 'PUNE-MUM-01',
    corridor_section_name: 'Pune Jn – Lonavala',
    corridor_key: 'PUNE-MUM',
    start_time: weekDate(4, 8),  // Friday 8 AM
    end_time: addMins(weekDate(4, 8), 160),
    duration_mins: 160,
    packed_tasks: [
      { defect_id: 'SIG-005', department: 'SMMS', description: 'Track circuit bonding repair', est_duration_mins: 80, criticality_score: 80, sequence_order: 1 },
      { defect_id: 'OHE-005', department: 'TDMS', description: 'Return conductor bonding at mast #412', est_duration_mins: 75, criticality_score: 52, sequence_order: 2 },
    ],
    shadow_multiplier: 1.69,
    status: 'pending',
    view: 'weekly',
    is_opportunistic: false,
  },
  {
    id: 'BLK-PUN-003',
    corridor_section_id: 'PUNE-MUM-03',
    corridor_section_name: 'Kalyan Jn – CSMT',
    corridor_key: 'PUNE-MUM',
    start_time: weekDate(3, 23),  // Thursday 11 PM (night block)
    end_time: addMins(weekDate(3, 23), 180),
    duration_mins: 180,
    packed_tasks: [
      { defect_id: 'TRK-008', department: 'TMS', description: 'Turnout #14 — Point & crossing repair', est_duration_mins: 90, criticality_score: 76, sequence_order: 1 },
      { defect_id: 'OHE-007', department: 'TDMS', description: 'Neutral section marker board replacement', est_duration_mins: 30, criticality_score: 35, sequence_order: 2 },
    ],
    shadow_multiplier: 1.33,
    status: 'approved',
    view: 'weekly',
    is_opportunistic: false,
    approved_by: 'Chief Controller - Mumbai',
    approved_at: '2026-08-27T08:00:00Z',
  },
];
