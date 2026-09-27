import type { DelayEvent } from '../types';

function minutesAgo(mins: number): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - mins);
  return d.toISOString();
}

function minutesFromNow(mins: number): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() + mins);
  return d.toISOString();
}

export const delayEvents: DelayEvent[] = [
  {
    id: 'DLY-001',
    train_id: '11077',
    train_name: 'Jhelum Express',
    delay_mins: 185,
    corridor_section_id: 'GWL-JHS-01',
    corridor_section_name: 'Gwalior Jn – Dabra',
    corridor_key: 'GWL-JHS',
    window_opened_mins: 170,
    window_start: minutesFromNow(15),
    suggested_tasks: [
      { defect_id: 'TRK-001', department: 'TMS', description: 'Weld fracture repair at km 12.4', est_duration_mins: 120, criticality_score: 95, sequence_order: 1 },
      { defect_id: 'OHE-001', department: 'TDMS', description: 'Catenary wire height correction', est_duration_mins: 110, criticality_score: 90, sequence_order: 2 },
    ],
    status: 'open',
    created_at: minutesAgo(8),
  },
  {
    id: 'DLY-002',
    train_id: '12138',
    train_name: 'Punjab Mail',
    delay_mins: 210,
    corridor_section_id: 'BPL-ET-01',
    corridor_section_name: 'Bhopal Jn – Hoshangabad',
    corridor_key: 'BPL-ET',
    window_opened_mins: 190,
    window_start: minutesFromNow(25),
    suggested_tasks: [
      { defect_id: 'SIG-002', department: 'SMMS', description: 'Signal cable fault repair km 49-51', est_duration_mins: 150, criticality_score: 91, sequence_order: 1 },
      { defect_id: 'TRK-002', department: 'TMS', description: 'Rail joint gap fishplate renewal', est_duration_mins: 90, criticality_score: 82, sequence_order: 2 },
      { defect_id: 'OHE-002', department: 'TDMS', description: 'ATD tension adjustment', est_duration_mins: 90, criticality_score: 75, sequence_order: 3 },
    ],
    status: 'open',
    created_at: minutesAgo(3),
  },
  {
    id: 'DLY-003',
    train_id: '11301',
    train_name: 'Udyan Express',
    delay_mins: 140,
    corridor_section_id: 'PUNE-MUM-02',
    corridor_section_name: 'Lonavala – Kalyan Jn',
    corridor_key: 'PUNE-MUM',
    window_opened_mins: 120,
    window_start: minutesFromNow(40),
    suggested_tasks: [
      { defect_id: 'OHE-003', department: 'TDMS', description: 'Insulator replacement — mast #287', est_duration_mins: 60, criticality_score: 79, sequence_order: 1 },
      { defect_id: 'SIG-003', department: 'SMMS', description: 'Signal lamp LED replacement', est_duration_mins: 45, criticality_score: 55, sequence_order: 2 },
    ],
    status: 'open',
    created_at: minutesAgo(12),
  },
  {
    id: 'DLY-004',
    train_id: '12627',
    train_name: 'Karnataka Express',
    delay_mins: 95,
    corridor_section_id: 'GWL-JHS-03',
    corridor_section_name: 'Datia – Jhansi Jn',
    corridor_key: 'GWL-JHS',
    window_opened_mins: 80,
    window_start: minutesAgo(30),
    suggested_tasks: [
      { defect_id: 'OHE-004', department: 'TDMS', description: 'Dropper wire repair — UP line', est_duration_mins: 45, criticality_score: 93, sequence_order: 1 },
    ],
    status: 'accepted',
    created_at: minutesAgo(45),
    accepted_at: minutesAgo(35),
  },
  {
    id: 'DLY-005',
    train_id: '19301',
    train_name: 'Yesvantpur Express',
    delay_mins: 60,
    corridor_section_id: 'PUNE-MUM-01',
    corridor_section_name: 'Pune Jn – Lonavala',
    corridor_key: 'PUNE-MUM',
    window_opened_mins: 45,
    window_start: minutesAgo(90),
    suggested_tasks: [
      { defect_id: 'TRK-006', department: 'TMS', description: 'Anti-creep device installation', est_duration_mins: 240, criticality_score: 38, sequence_order: 1 },
    ],
    status: 'dismissed',
    created_at: minutesAgo(100),
    dismissed_at: minutesAgo(85),
  },
];
