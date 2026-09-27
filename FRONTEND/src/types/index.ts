// =============================================================================
// SIH26027 — AI Block Planner: Entity Types
// These types define the contract between the frontend and the (future) backend.
// They mirror the DB schema from the project blueprint so no remapping is needed.
// =============================================================================

// --- Enums & Unions ---

export type Department = 'TMS' | 'SMMS' | 'TDMS';

export type DepartmentLabel = {
  [K in Department]: string;
};

export const DEPARTMENT_LABELS: DepartmentLabel = {
  TMS: 'Track (Engineering)',
  SMMS: 'Signal & Telecom',
  TDMS: 'Traction Distribution',
};

export const DEPARTMENT_COLORS: Record<Department, string> = {
  TMS: '#3B82F6',   // Blue for Track
  SMMS: '#3E8E5A',  // Green for Signal
  TDMS: '#E8A33D',  // Orange/Amber for Traction
};

export type DefectStatus = 'open' | 'in_progress' | 'scheduled' | 'completed' | 'deferred';

export type UrgencyBand = 'critical' | 'high' | 'medium' | 'low';

export type BlockStatus = 'pending' | 'approved' | 'modified' | 'in_progress' | 'completed';

export type DelayEventStatus = 'open' | 'accepted' | 'dismissed';

export type UserRole = 'controller' | 'engineer';

export type ConnectionStatus = 'connected' | 'degraded' | 'down';

export type TimeView = 'weekly' | 'monthly';

// --- Core Entities ---

export interface CorridorSection {
  id: string;
  name: string;
  from_station: string;
  to_station: string;
  line: 'UP' | 'DOWN' | 'BOTH';
  length_km: number;
  division: string;
}

export interface CriticalityScore {
  overall: number; // 0-100
  severity: number;
  overdue_factor: number;
  traffic_density: number;
  failure_risk: number;
}

export interface Defect {
  id: string;
  department: Department;
  corridor_section_id: string;
  corridor_section_name: string;
  chainage_km: number;
  description: string;
  defect_type: string;
  severity: UrgencyBand;
  criticality: CriticalityScore;
  est_duration_mins: number;
  overdue_days: number;
  status: DefectStatus;
  reported_at: string; // ISO date
  last_inspected_at: string; // ISO date
  assigned_crew?: string;
  not_scheduled_reason?: string; // "Why not scheduled" explanation
}

export interface PackedTask {
  defect_id: string;
  department: Department;
  description: string;
  est_duration_mins: number;
  criticality_score: number;
  sequence_order: number;
}

export interface BlockWindow {
  id: string;
  corridor_section_id: string;
  corridor_section_name: string;
  corridor_key: string; // 'GWL-JHS' | 'BPL-ET' | 'PUNE-MUM'
  start_time: string; // ISO datetime
  end_time: string;   // ISO datetime
  duration_mins: number;
  packed_tasks: PackedTask[];
  shadow_multiplier: number;
  status: BlockStatus;
  view: TimeView;
  is_opportunistic: boolean; // delay-triggered window
  approved_by?: string;
  approved_at?: string;
}

export interface DelayEvent {
  id: string;
  train_id: string;
  train_name: string;
  delay_mins: number;
  corridor_section_id: string;
  corridor_section_name: string;
  corridor_key: string;
  window_opened_mins: number;
  window_start: string; // ISO datetime
  suggested_tasks: PackedTask[];
  status: DelayEventStatus;
  created_at: string;
  accepted_at?: string;
  dismissed_at?: string;
}

export interface KPIDashboard {
  shadow_multiplier: number;
  critical_defects_pending: number;
  blocks_this_week: number;
  downtime_saved_mtd_hours: number;
  multiplier_trend: number; // % change from last period
  defects_trend: number;
  blocks_trend: number;
  downtime_trend: number;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  department?: Department; // only for engineers
  division: string;
}

export interface SystemHealth {
  tms: ConnectionStatus;
  smms: ConnectionStatus;
  tdms: ConnectionStatus;
  coa: ConnectionStatus;
  last_synced: string; // ISO datetime
}

// --- Filter/Query Types ---

export interface BacklogFilters {
  departments?: Department[];
  corridor_section_id?: string;
  urgency?: UrgencyBand[];
  status?: DefectStatus[];
  search?: string;
}

export interface BlockScheduleQuery {
  view: TimeView;
  corridor_key?: string;
  status?: BlockStatus[];
}

// --- Auth Types (hook points for real provider) ---

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthProvider {
  login: (role: UserRole, department?: Department) => Promise<User>;
  logout: () => Promise<void>;
  getUser: () => User | null;
  // TODO(backend): Add real auth methods (OAuth, JWT refresh, etc.)
}

// --- Chart/Report Types ---

export interface TrendDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface UtilizationReport {
  multiplier_trend: TrendDataPoint[];
  downtime_saved: TrendDataPoint[];
  backlog_cleared: TrendDataPoint[];
  period: { start: string; end: string };
}
