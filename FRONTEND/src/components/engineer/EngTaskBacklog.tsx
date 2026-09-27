/**
 * EngTaskBacklog.tsx
 * Department-Engineer Task Backlog — full layout (sidebar + main content).
 * Role is fixed to ENGINEER. Live Feed nav is strictly hidden.
 */
import { Fragment, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  TrainFront,
  LayoutDashboard,
  ListTodo,
  CalendarDays,
  BarChart2,
  Search,
  ChevronDown,
  Layers,
  Sparkles,
  Users,
  Clock,
  SlidersHorizontal,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Timer,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
export type Department = "TMS" | "SMMS" | "TDMS";

interface EngineerTaskBacklogProps {
  role?: "ENGINEER";         // always ENGINEER for this component
  department?: Department;   // default TMS
}

interface BacklogTask {
  id: string;
  dept: Department;
  section: string;
  chainage: string;
  defectType: string;
  criticality: number;
  reqTime: number;
  dueDate: string;
  corridor: string;
  shadowCompatible: boolean;
  aiReasoning: string;
  crew: {
    name: string;
    status: "Deployed" | "Standby" | "En Route" | "Off Duty";
    eta?: string;
  };
}

// ─── Department meta ──────────────────────────────────────────────────────────
const DEPT_META: Record<Department, { label: string; shortLabel: string; color: string; tint: string; bg: string }> = {
  TMS:  { label: "TMS · Track Maintenance",    shortLabel: "TMS / Track",    color: "#3B82F6", tint: "rgba(59,130,246,0.10)",  bg: "#EFF6FF" },
  SMMS: { label: "SMMS · Signal & Telecom",    shortLabel: "SMMS / Signal",  color: "#10B981", tint: "rgba(16,185,129,0.10)",  bg: "#ECFDF5" },
  TDMS: { label: "TDMS · Traction Dist.",      shortLabel: "TDMS / Traction",color: "#F97316", tint: "rgba(249,115,22,0.10)",  bg: "#FFF7ED" },
};

// ─── Mock dataset: ~10 tasks across all three depts ───────────────────────────
const ALL_TASKS: BacklogTask[] = [
  // TMS
  {
    id: "TRK-9021", dept: "TMS", section: "Km 142.5 – 143.0", chainage: "142.5", defectType: "Rail Gauge Deviation",
    criticality: 98, reqTime: 120, dueDate: "02 Sep 2026", corridor: "BPL-ET", shadowCompatible: true,
    aiReasoning: "Score boosted to 98: High traffic density (78 trains/day) on this upline curve. Gauge deviation of 14 mm exceeded Safety Threshold B (12 mm). Rail wear index at 0.87 — fracture risk within 48 hrs. Overdue by 4 days. High clustering opportunity with SIG-882 in the same possession window.",
    crew: { name: "Track Gang 4 (GWL)", status: "Standby" },
  },
  {
    id: "TRK-9104", dept: "TMS", section: "Km 156.0 – 157.2", chainage: "156.0", defectType: "Ballast Deficiency",
    criticality: 76, reqTime: 90, dueDate: "05 Sep 2026", corridor: "BPL-ET", shadowCompatible: false,
    aiReasoning: "Ballast deficiency identified by TRC run on 28 Aug. Tamping machine required — exclusive possession mandatory. Cannot be shadow-packed with signal or traction tasks due to machine footprint. Criticality elevated by 3-day overdue factor.",
    crew: { name: "Track Gang 2 (ET)", status: "En Route", eta: "14 min" },
  },
  {
    id: "TRK-8812", dept: "TMS", section: "Km 160.1 – 161.0", chainage: "160.1", defectType: "Sleeper Replacement",
    criticality: 55, reqTime: 75, dueDate: "09 Sep 2026", corridor: "GWL-JHS", shadowCompatible: true,
    aiReasoning: "Moderate sleeper wear detected during patrolling. Compatible with upcoming OHE maintenance window in the East sector (same Km band). Shadow efficiency estimated at 1.9x if combined.",
    crew: { name: "Track Gang 7 (JHS)", status: "Off Duty" },
  },
  {
    id: "TRK-7743", dept: "TMS", section: "GWL Yard – Loop 3", chainage: "GWL Yd", defectType: "Cross-Level Defect",
    criticality: 91, reqTime: 60, dueDate: "31 Aug 2026", corridor: "GWL-JHS", shadowCompatible: true,
    aiReasoning: "Cross-level of 8 mm on Loop 3 — safety threshold exceeded. Yard traffic of 220 wagon movements/day. Overdue by 1 day. Packable inside existing GWL Yard block on 01 Sep with Signal & Traction crews already deployed.",
    crew: { name: "Track Gang 1 (GWL)", status: "Deployed" },
  },
  // SMMS
  {
    id: "SIG-882", dept: "SMMS", section: "Km 142.8 North", chainage: "142.8", defectType: "Point Machine Failure",
    criticality: 91, reqTime: 90, dueDate: "01 Sep 2026", corridor: "GWL-JHS", shadowCompatible: true,
    aiReasoning: "Repeat point-machine failure (4 events in 30 days). Interlocking risk elevated. Co-located with TRK-9021 tamping window — shadow efficiency 3.1x if combined.",
    crew: { name: "Signal Gang Alpha (GWL)", status: "Deployed" },
  },
  {
    id: "SIG-112", dept: "SMMS", section: "Km 155.8 Main", chainage: "155.8", defectType: "Interlocking Update",
    criticality: 78, reqTime: 45, dueDate: "04 Sep 2026", corridor: "BPL-ET", shadowCompatible: false,
    aiReasoning: "Interlocking logic update — software patch and hardware relay verification required. Isolated task due to exclusive relay room access. Criticality steady at 78 due to 2-day overdue.",
    crew: { name: "Signal Gang Beta (BPL)", status: "Standby" },
  },
  {
    id: "SIG-330", dept: "SMMS", section: "JHS Junction", chainage: "JHS Jn", defectType: "Relay Humidity",
    criticality: 62, reqTime: 30, dueDate: "07 Sep 2026", corridor: "GWL-JHS", shadowCompatible: true,
    aiReasoning: "Relay humidity test due. Low priority, fits idle capacity in the Wednesday night shadow block. Estimated 0.5 hrs; combinable with TMS routine patrolling in the same corridor.",
    crew: { name: "Signal Gang Gamma (JHS)", status: "Standby" },
  },
  // TDMS
  {
    id: "OHE-104", dept: "TDMS", section: "Km 150.2 South", chainage: "150.2", defectType: "Contact Wire Deviation",
    criticality: 74, reqTime: 60, dueDate: "03 Sep 2026", corridor: "BPL-ET", shadowCompatible: true,
    aiReasoning: "Contact wire height deviation of 18 mm at Km 150.2. Moderate urgency; packable inside the existing 180-min traction block. 3 loco-pilot complaints logged. Risk of pantograph damage if unattended beyond 5 days.",
    crew: { name: "OHE Gang Alpha (ET)", status: "En Route", eta: "22 min" },
  },
  {
    id: "OHE-505", dept: "TDMS", section: "Km 120.4 South", chainage: "120.4", defectType: "Insulator Cleaning",
    criticality: 30, reqTime: 30, dueDate: "15 Sep 2026", corridor: "BPL-ET", shadowCompatible: true,
    aiReasoning: "Routine insulator cleaning, low priority. Can be piggybacked onto any mainline block in the South zone. Shadow efficiency 1.5x if combined with any scheduled track work.",
    crew: { name: "OHE Gang Beta (BPL)", status: "Off Duty" },
  },
  {
    id: "OHE-211", dept: "TDMS", section: "BPL-ET Sector 3", chainage: "BPL S3", defectType: "Neutral Section Arcing",
    criticality: 88, reqTime: 150, dueDate: "02 Sep 2026", corridor: "BPL-ET", shadowCompatible: false,
    aiReasoning: "Arcing reported by 3 loco pilots. Requires isolated power block; cannot be shadowed with track machines due to safety exclusion zone. Score elevated to 88 — potential for pantograph flashover within 72 hrs.",
    crew: { name: "OHE Gang Gamma (ET)", status: "Standby" },
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function scoreColor(s: number) { return s >= 90 ? "#C13B3B" : s >= 60 ? "#E8A33D" : "#3E8E5A"; }
function scoreLabel(s: number) { return s >= 90 ? "Critical" : s >= 60 ? "Caution" : "Clear"; }

function CrewStatusBadge({ status }: { status: BacklogTask["crew"]["status"] }) {
  const map: Record<string, { icon: React.ReactNode; cls: string }> = {
    Deployed:  { icon: <CheckCircle2 className="h-3.5 w-3.5" />, cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    Standby:   { icon: <Timer className="h-3.5 w-3.5" />,        cls: "bg-amber-50  text-amber-700  border-amber-200" },
    "En Route":{ icon: <MapPin className="h-3.5 w-3.5" />,       cls: "bg-blue-50   text-blue-700   border-blue-200" },
    "Off Duty":{ icon: <Clock className="h-3.5 w-3.5" />,        cls: "bg-gray-100  text-gray-500   border-gray-200" },
  };
  const m = map[status] ?? map["Standby"];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold", m.cls)}>
      {m.icon}{status}
    </span>
  );
}

function CriticalityGauge({ score }: { score: number }) {
  const color = scoreColor(score);
  const r = 20, c = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-12 w-12">
        <svg className="h-12 w-12 -rotate-90" viewBox="0 0 48 48">
          <circle cx="24" cy="24" r={r} fill="none" stroke="#F3F4F6" strokeWidth="4" />
          <circle cx="24" cy="24" r={r} fill="none" stroke={color} strokeWidth="4"
            strokeLinecap="round" strokeDasharray={c}
            strokeDashoffset={c - (c * score) / 100}
            className="transition-all duration-700"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[12px] font-extrabold" style={{ color }}>{score}</span>
      </div>
      <span className="rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ color, backgroundColor: `${color}1a` }}>
        {scoreLabel(score)}
      </span>
    </div>
  );
}

// ─── Sidebar (Engineer-only — no Live Feed) ───────────────────────────────────
const ENG_NAV = [
  { label: "Dashboard",    icon: LayoutDashboard, to: "/eng-dashboard.html" },
  { label: "Task Backlog", icon: ListTodo,         to: "/backlog" },
  { label: "Block Planner",icon: CalendarDays,     to: "/planner" },
  { label: "Reports",      icon: BarChart2,         to: "/reports" },
];

function EngineerSidebar({ department }: { department: Department }) {
  const location = useLocation();
  const meta = DEPT_META[department];
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-gray-100 bg-white shadow-[1px_0_0_0_#F3F4F6] lg:flex">
      {/* Logo */}
      <div className="flex h-20 items-center gap-3 px-6 border-b border-gray-50">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#14C9A0] text-white shadow-sm">
          <TrainFront className="h-5 w-5" />
        </span>
        <div>
          <p className="text-[15px] font-extrabold tracking-tight">RAIL-OPS</p>
          <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF]">Control Centre</p>
        </div>
      </div>

      {/* Dept badge */}
      <div className="px-4 py-3 border-b border-gray-50">
        <div className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ backgroundColor: meta.bg }}>
          <span className="flex h-7 w-7 items-center justify-center rounded-lg text-white text-[11px] font-extrabold" style={{ backgroundColor: meta.color }}>
            {department}
          </span>
          <div>
            <p className="text-[11px] font-extrabold" style={{ color: meta.color }}>{meta.shortLabel}</p>
            <p className="text-[9px] text-[#9CA3AF] font-semibold uppercase tracking-wider">Active Department</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        {ENG_NAV.map((item) => {
          const active = location.pathname === item.to || (item.to === "/backlog" && location.pathname.startsWith("/backlog"));
          return (
            <Link key={item.label} to={item.to}
              className={cn(
                "flex items-center gap-3 rounded-xl border-l-[3px] px-4 py-3 text-sm font-medium transition-all duration-150",
                active
                  ? "border-[#14C9A0] bg-[#14C9A0]/8 font-bold text-[#14C9A0]"
                  : "border-transparent text-[#6B7280] hover:bg-gray-50 hover:text-[#111827]",
              )}>
              <item.icon className="h-[17px] w-[17px] shrink-0" />{item.label}
            </Link>
          );
        })}

        {/* Live Feed — visually locked */}
        <div className="flex items-center gap-3 rounded-xl border-l-[3px] border-transparent px-4 py-3 text-sm font-medium text-gray-300 cursor-not-allowed select-none">
          <AlertTriangle className="h-[17px] w-[17px] shrink-0 text-gray-300" />
          Live Feed
          <span className="ml-auto rounded-md bg-gray-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-gray-400">
            Restricted
          </span>
        </div>
      </nav>

      {/* User footer */}
      <div className="border-t border-gray-100 p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-[11px] font-extrabold text-white">
            RK
          </span>
          <div>
            <p className="text-sm font-bold text-[#111827]">Ravi Kumar</p>
            <p className="text-[10px] text-[#9CA3AF]">Dept. Engineer · {meta.shortLabel}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function EngTaskBacklog({
  role = "ENGINEER",
  department = "TMS",
}: EngineerTaskBacklogProps) {
  const [query, setQuery]     = useState("");
  const [sort, setSort]       = useState<"criticality" | "dueDate" | "reqTime">("criticality");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [activeDept, setActiveDept] = useState<Department>(department);

  const meta = DEPT_META[activeDept];

  // RBAC filter: engineer sees ONLY their department
  const rows = useMemo(() => {
    let filtered = ALL_TASKS.filter((t) => {
      if (role === "ENGINEER" && t.dept !== activeDept) return false;
      if (query) {
        const q = query.toLowerCase();
        if (
          !t.id.toLowerCase().includes(q) &&
          !t.section.toLowerCase().includes(q) &&
          !t.defectType.toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
    if (sort === "criticality") filtered.sort((a, b) => b.criticality - a.criticality);
    if (sort === "dueDate")     filtered.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    if (sort === "reqTime")     filtered.sort((a, b) => a.reqTime - b.reqTime);
    return filtered;
  }, [activeDept, query, sort, role]);

  const critical = rows.filter(t => t.criticality >= 90).length;
  const shadowReady = rows.filter(t => t.shadowCompatible).length;

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] text-[#111827]">
      <EngineerSidebar department={activeDept} />

      {/* Main panel */}
      <div className="flex flex-1 flex-col lg:ml-[248px]">

        {/* Top header */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-gray-100 bg-white/95 px-6 backdrop-blur">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-[13px] font-bold text-[#111827]">Department Task Backlog</p>
              <p className="text-[11px] text-[#9CA3AF]">
                Filtered · {activeDept} only · {rows.length} pending tasks
              </p>
            </div>
          </div>
          {/* Department switcher for demo */}
          <div className="flex items-center gap-3">
            <label className="relative">
              <SlidersHorizontal className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9CA3AF]" />
              <select value={activeDept} onChange={e => { setActiveDept(e.target.value as Department); setExpanded(null); }}
                className="appearance-none rounded-xl border border-gray-200 bg-white py-2 pl-8 pr-7 text-xs font-bold outline-none focus:border-[#14C9A0]">
                <option value="TMS">TMS · Track</option>
                <option value="SMMS">SMMS · Signal</option>
                <option value="TDMS">TDMS · Traction</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9CA3AF]" />
            </label>
          </div>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-auto px-6 py-7 lg:px-8 lg:py-8">

          {/* ── Page header ── */}
          <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-extrabold tracking-tight text-[#111827]">Department Task Backlog</h1>
                {/* Active context pill */}
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 border border-blue-100">
                  Active View: {meta.shortLabel}
                </span>
              </div>
              <p className="text-sm text-[#6B7280]">
                {rows.length} task{rows.length !== 1 ? "s" : ""} · {critical} critical · {shadowReady} shadow-ready — sorted by AI urgency
              </p>
            </div>

            {/* Search + sort */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                <input value={query} onChange={e => setQuery(e.target.value)}
                  placeholder="Search ID, section, defect…"
                  className="w-64 rounded-full border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none placeholder:text-[#9CA3AF] transition-colors duration-150 focus:border-[#14C9A0] focus:ring-2 focus:ring-[#14C9A0]/10"
                />
              </div>
              <div className="relative">
                <select value={sort} onChange={e => setSort(e.target.value as typeof sort)}
                  className="appearance-none rounded-full border border-gray-200 bg-white py-2.5 pl-4 pr-8 text-sm font-semibold outline-none transition-colors duration-150 focus:border-[#14C9A0]">
                  <option value="criticality">Sort by: AI Urgency</option>
                  <option value="dueDate">Sort by: Due Date</option>
                  <option value="reqTime">Sort by: Req. Time</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9CA3AF]" />
              </div>
            </div>
          </div>

          {/* ── Summary strip ── */}
          <div className="mb-6 grid grid-cols-3 gap-4">
            {[
              { icon: <AlertTriangle className="h-4 w-4" />, label: "Critical", value: critical,                    color: "#C13B3B", bg: "#FEF2F2" },
              { icon: <Layers className="h-4 w-4" />,        label: "Shadow-Ready", value: shadowReady,             color: "#14C9A0", bg: "#F0FDF9" },
              { icon: <Users className="h-4 w-4" />,         label: "Crews Active", value: rows.filter(t => t.crew.status === "Deployed" || t.crew.status === "En Route").length,
                color: "#3B82F6", bg: "#EFF6FF" },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: s.bg, color: s.color }}>
                  {s.icon}
                </span>
                <div>
                  <p className="text-2xl font-extrabold" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Table ── */}
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
                    <th className="px-6 py-4">Defect ID</th>
                    <th className="px-6 py-4">Section / Km</th>
                    <th className="px-6 py-4">Asset / Defect Type</th>
                    <th className="px-6 py-4">AI Criticality</th>
                    <th className="px-6 py-4">Req. Time</th>
                    <th className="px-6 py-4">Due Date</th>
                    <th className="px-6 py-4">Shadow Compat.</th>
                    <th className="px-4 py-4" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((task) => {
                    const open = expanded === task.id;
                    return (
                      <Fragment key={task.id}>
                        {/* ── Data row ── */}
                        <tr
                          onClick={() => setExpanded(open ? null : task.id)}
                          className={cn(
                            "cursor-pointer border-b border-l-4 transition-all duration-150",
                            open
                              ? "border-b-0 border-l-[#14C9A0] bg-[#14C9A0]/[0.03]"
                              : "border-gray-50 border-l-transparent hover:border-l-[#14C9A0] hover:bg-gray-50",
                          )}
                        >
                          {/* Defect ID */}
                          <td className="px-6 py-4">
                            <span className="font-bold text-[#111827]">{task.id}</span>
                          </td>

                          {/* Section */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 text-[#6B7280]">
                              <MapPin className="h-3.5 w-3.5 shrink-0 text-[#9CA3AF]" />
                              <span className="text-[13px]">{task.section}</span>
                            </div>
                          </td>

                          {/* Asset / Defect Type */}
                          <td className="px-6 py-4">
                            <span className="text-[13px] font-medium text-[#374151]">{task.defectType}</span>
                          </td>

                          {/* Criticality gauge */}
                          <td className="px-6 py-4">
                            <CriticalityGauge score={task.criticality} />
                          </td>

                          {/* Req. Time */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 text-[#9CA3AF]" />
                              <span className="text-[13px] font-semibold text-[#374151]">{task.reqTime} min</span>
                            </div>
                          </td>

                          {/* Due Date */}
                          <td className="px-6 py-4 text-[13px] text-[#6B7280]">{task.dueDate}</td>

                          {/* Shadow compatibility */}
                          <td className="px-6 py-4">
                            {task.shadowCompatible ? (
                              <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#14C9A0]/10 px-2.5 py-1.5 text-[11px] font-bold text-[#14C9A0]">
                                <Layers className="h-3.5 w-3.5" />Parallel Ready
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-2.5 py-1.5 text-[11px] font-semibold text-[#9CA3AF]">
                                Exclusive
                              </span>
                            )}
                          </td>

                          {/* Chevron */}
                          <td className="px-4 py-4">
                            <ChevronDown className={cn(
                              "h-4 w-4 text-[#9CA3AF] transition-transform duration-200",
                              open && "rotate-180 text-[#14C9A0]",
                            )} />
                          </td>
                        </tr>

                        {/* ── Expanded row ── */}
                        {open && (
                          <tr className="border-b border-[#14C9A0]/10">
                            <td colSpan={8} className="bg-[#14C9A0]/[0.025] px-6 pb-6 pt-0">
                              <div className="grid grid-cols-1 gap-4 pt-4 md:grid-cols-2">

                                {/* Panel A — AI Reasoning */}
                                <div className="rounded-xl border border-[#14C9A0]/20 bg-white p-5 shadow-sm">
                                  <div className="mb-3 flex items-center gap-2">
                                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#14C9A0]/10 text-[#14C9A0]">
                                      <Sparkles className="h-4 w-4" />
                                    </span>
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF]">AI Reasoning</p>
                                  </div>
                                  <p className="text-[13px] leading-relaxed text-[#374151]">{task.aiReasoning}</p>
                                  {/* Score bar */}
                                  <div className="mt-4">
                                    <div className="mb-1.5 flex items-center justify-between">
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Urgency</span>
                                      <span className="text-[11px] font-bold" style={{ color: scoreColor(task.criticality) }}>{task.criticality}/100</span>
                                    </div>
                                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                                      <div
                                        className="h-full rounded-full transition-all duration-700"
                                        style={{ width: `${task.criticality}%`, backgroundColor: scoreColor(task.criticality) }}
                                      />
                                    </div>
                                  </div>
                                </div>

                                {/* Panel B — Crew Dispatch */}
                                <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                                  <div className="mb-3 flex items-center gap-2">
                                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                      <Users className="h-4 w-4" />
                                    </span>
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF]">Crew Dispatch State</p>
                                  </div>
                                  <div className="flex items-start gap-4">
                                    <div className="flex-1">
                                      <p className="text-[14px] font-bold text-[#111827]">{task.crew.name}</p>
                                      {task.crew.eta && (
                                        <p className="mt-1 text-[12px] text-[#6B7280]">ETA: {task.crew.eta}</p>
                                      )}
                                      <div className="mt-3">
                                        <CrewStatusBadge status={task.crew.status} />
                                      </div>
                                    </div>
                                    {/* Dept tag */}
                                    <div className="rounded-xl px-3 py-2 text-center" style={{ background: meta.tint }}>
                                      <p className="text-[11px] font-extrabold" style={{ color: meta.color }}>{activeDept}</p>
                                      <p className="text-[9px] text-[#9CA3AF] font-semibold mt-0.5">Dept</p>
                                    </div>
                                  </div>
                                  {task.shadowCompatible && (
                                    <div className="mt-4 flex items-center gap-2 rounded-lg bg-[#14C9A0]/8 px-3 py-2.5">
                                      <Layers className="h-4 w-4 shrink-0 text-[#14C9A0]" />
                                      <p className="text-[12px] font-semibold text-[#14C9A0]">
                                        Eligible for Shadow Block — assign crew after block approval
                                      </p>
                                    </div>
                                  )}
                                </div>

                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}

                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-6 py-20 text-center text-sm text-[#9CA3AF]">
                        No tasks match the current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
