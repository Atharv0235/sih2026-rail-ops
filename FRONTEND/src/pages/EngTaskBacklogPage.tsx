import { useAuthStore } from '../store/useAuthStore';
import { EngTaskBacklog } from '../components/engineer/EngTaskBacklog';
import type { Department } from '../components/engineer/EngTaskBacklog';

// Dept mapping: store uses 'Track'|'Signal'|'Traction', component uses 'TMS'|'SMMS'|'TDMS'
const DEPT_MAP: Record<string, Department> = {
  Track:    'TMS',
  Signal:   'SMMS',
  Traction: 'TDMS',
};

export function EngTaskBacklogPage() {
  const storeDept = useAuthStore(s => s.department) ?? 'Track';
  const department: Department = DEPT_MAP[storeDept] ?? 'TMS';

  return <EngTaskBacklog role="ENGINEER" department={department} />;
}
