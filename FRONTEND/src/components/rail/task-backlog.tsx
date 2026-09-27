import { Fragment, useMemo, useState } from "react";
import { Search, Layers, ChevronDown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export type Role = "CONTROLLER" | "ENGINEER";
export type Department = "TMS" | "SMMS" | "TDMS" | "ALL";

export interface BacklogTask {
  id: string;
  dept: Exclude<Department, "ALL">;
  section: string;
  criticality: number;
  reqTime: number;
  dueDate: string;
  corridor: string;
  shadowCompatible: boolean;
  reasoning: string;
}

const DEPT_META: Record<
  Exclude<Department, "ALL">,
  { label: string; color: string; tint: string }
> = {
  TMS: { label: "TMS · Track", color: "#3B82F6", tint: "rgba(59,130,246,0.12)" },
  SMMS: { label: "SMMS · Signal", color: "#10B981", tint: "rgba(16,185,129,0.12)" },
  TDMS: { label: "TDMS · Traction", color: "#F97316", tint: "rgba(249,115,22,0.12)" },
};

export const BACKLOG_TASKS: BacklogTask[] = [
  {
    id: "DEF-10241",
    dept: "TMS",
    section: "Km 140-145 (Up)",
    criticality: 96,
    reqTime: 120,
    dueDate: "02 Sep 2026",
    corridor: "BPL-ET",
    shadowCompatible: true,
    reasoning:
      "Score boosted due to high traffic density (78 trains/day) + 3 days overdue. Rail wear index crossed 0.82 threshold on the Up line.",
  },
  {
    id: "DEF-10233",
    dept: "SMMS",
    section: "GWL Yard Panel B",
    criticality: 91,
    reqTime: 90,
    dueDate: "01 Sep 2026",
    corridor: "GWL-JHS",
    shadowCompatible: true,
    reasoning:
      "Repeat point-machine failure (4 events in 30 days). Interlocking risk elevated; co-located with TMS tamping window.",
  },
  {
    id: "DEF-10218",
    dept: "TDMS",
    section: "JHS Approach OHE-14",
    criticality: 74,
    reqTime: 60,
    dueDate: "05 Sep 2026",
    corridor: "GWL-JHS",
    shadowCompatible: true,
    reasoning:
      "Contact wire height deviation of 18mm. Moderate urgency; packable inside the existing 180-min traction block.",
  },
  {
    id: "DEF-10205",
    dept: "TMS",
    section: "Km 162-164 (Dn)",
    criticality: 63,
    reqTime: 45,
    dueDate: "08 Sep 2026",
    corridor: "BPL-ET",
    shadowCompatible: false,
    reasoning:
      "Ballast deficiency flagged by TRC run. Requires exclusive possession — machine footprint blocks parallel work.",
  },
  {
    id: "DEF-10192",
    dept: "SMMS",
    section: "ET Cabin Relay Room",
    criticality: 41,
    reqTime: 30,
    dueDate: "12 Sep 2026",
    corridor: "BPL-ET",
    shadowCompatible: true,
    reasoning:
      "Preventive relay insulation test. Low criticality, but fits idle capacity in the Wed night shadow block.",
  },
  {
    id: "DEF-10187",
    dept: "TDMS",
    section: "Km 151 Neutral Section",
    criticality: 88,
    reqTime: 150,
    dueDate: "03 Sep 2026",
    corridor: "BPL-ET",
    shadowCompatible: false,
    reasoning:
      "Arcing reported by 3 loco pilots. Requires isolated power block; cannot be shadowed with track machines.",
  },
];

function statusColor(score: number) {
  if (score >= 90) return "#C13B3B";
  if (score >= 60) return "#E8A33D";
  return "#3E8E5A";
}

function statusLabel(score: number) {
  if (score >= 90) return "Critical";
  if (score >= 60) return "Caution";
  return "Clear";
}

function CriticalityGauge({ score }: { score: number }) {
  const color = statusColor(score);
  const r = 18;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-11 w-11">
        <svg className="h-11 w-11 -rotate-90" viewBox="0 0 44 44">
          <circle cx="22" cy="22" r={r} fill="none" stroke="#F3F4F6" strokeWidth="4" />
          <circle
            cx="22"
            cy="22"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c - (c * score) / 100}
            className="transition-all duration-500"
          />
        </svg>
        <span
          className="absolute inset-0 flex items-center justify-center text-[11px] font-extrabold"
          style={{ color }}
        >
          {score}
        </span>
      </div>
      <span
        className="rounded-full px-2.5 py-1 text-[11px] font-bold"
        style={{ color, backgroundColor: `${color}1a` }}
      >
        {statusLabel(score)}
      </span>
    </div>
  );
}

const TIERS = ["Critical", "High", "Medium"] as const;

export function TaskBacklog({
  role,
  department,
}: {
  role: Role;
  department: Department;
}) {
  const [query, setQuery] = useState("");
  const [tiers, setTiers] = useState<string[]>([]);
  const [corridors, setCorridors] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  const allCorridors = useMemo(
    () => Array.from(new Set(BACKLOG_TASKS.map((t) => t.corridor))),
    [],
  );

  const rows = useMemo(() => {
    return BACKLOG_TASKS.filter((t) => {
      if (role === "ENGINEER" && department !== "ALL" && t.dept !== department)
        return false;
      if (query) {
        const q = query.toLowerCase();
        if (
          !t.id.toLowerCase().includes(q) &&
          !t.section.toLowerCase().includes(q) &&
          !t.dept.toLowerCase().includes(q)
        )
          return false;
      }
      if (tiers.length) {
        const tier =
          t.criticality >= 90 ? "Critical" : t.criticality >= 60 ? "High" : "Medium";
        if (!tiers.includes(tier)) return false;
      }
      if (corridors.length && !corridors.includes(t.corridor)) return false;
      return true;
    }).sort((a, b) => b.criticality - a.criticality);
  }, [role, department, query, tiers, corridors]);

  const toggle = (list: string[], set: (v: string[]) => void, v: string) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const pill = (active: boolean) =>
    cn(
      "rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors duration-150",
      active
        ? "border-[#14C9A0] bg-[#14C9A0]/10 text-[#14C9A0]"
        : "border-gray-200 text-[#6B7280] hover:border-gray-300 hover:text-[#111827]",
    );

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#111827]">
            Unified Task Registry
          </h1>
          <p className="mt-1 text-sm text-[#6B7280]">
            {rows.length} tasks ranked by AI criticality across all departments
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search defect ID, section, dept…"
            className="w-72 rounded-full border border-gray-200 bg-white py-2.5 pl-11 pr-4 text-sm text-[#111827] outline-none transition-colors duration-150 placeholder:text-[#9CA3AF] focus:border-[#14C9A0]"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {TIERS.map((t) => (
          <button
            key={t}
            onClick={() => toggle(tiers, setTiers, t)}
            className={pill(tiers.includes(t))}
          >
            {t}
          </button>
        ))}
        <span className="mx-2 h-5 w-px bg-gray-200" />
        {allCorridors.map((c) => (
          <button
            key={c}
            onClick={() => toggle(corridors, setCorridors, c)}
            className={pill(corridors.includes(c))}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-[11px] uppercase tracking-wider text-[#9CA3AF]">
                <th className="px-6 py-4 font-semibold">Defect ID</th>
                <th className="px-6 py-4 font-semibold">Originating Dept</th>
                <th className="px-6 py-4 font-semibold">Section / Km</th>
                <th className="px-6 py-4 font-semibold">AI Criticality</th>
                <th className="px-6 py-4 font-semibold">Req. Time</th>
                <th className="px-6 py-4 font-semibold">Due Date</th>
                <th className="px-6 py-4 font-semibold">Compatibility</th>
                <th className="px-4 py-4" />
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => {
                const meta = DEPT_META[t.dept];
                const open = expanded === t.id;
                return (
                  <Fragment key={t.id}>
                    <tr
                      onClick={() => setExpanded(open ? null : t.id)}
                      className="cursor-pointer border-b border-l-4 border-gray-50 border-l-transparent transition-colors duration-150 hover:border-l-4 hover:border-l-[#14C9A0] hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 font-bold text-[#111827]">{t.id}</td>
                      <td className="px-6 py-4">
                        <span
                          className="rounded-full px-3 py-1 text-xs font-semibold"
                          style={{ color: meta.color, backgroundColor: meta.tint }}
                        >
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[#6B7280]">{t.section}</td>
                      <td className="px-6 py-4">
                        <CriticalityGauge score={t.criticality} />
                      </td>
                      <td className="px-6 py-4 text-[#111827]">{t.reqTime} min</td>
                      <td className="px-6 py-4 text-[#6B7280]">{t.dueDate}</td>
                      <td className="px-6 py-4">
                        {t.shadowCompatible ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#14C9A0]/10 px-3 py-1 text-xs font-semibold text-[#14C9A0]">
                            <Layers className="h-3.5 w-3.5" />
                            Shadow Packing
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-[#6B7280]">
                            Exclusive
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 text-[#9CA3AF] transition-transform duration-200",
                            open && "rotate-180 text-[#14C9A0]",
                          )}
                        />
                      </td>
                    </tr>
                    {open && (
                      <tr className="border-b border-gray-50">
                        <td colSpan={8} className="bg-gray-50/80 px-6 py-5">
                          <div className="flex items-start gap-3">
                            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#14C9A0]/10 text-[#14C9A0]">
                              <Sparkles className="h-4 w-4" />
                            </span>
                            <div>
                              <p className="text-xs font-bold uppercase tracking-wider text-[#9CA3AF]">
                                AI Reasoning
                              </p>
                              <p className="mt-1 max-w-3xl text-sm leading-relaxed text-[#374151]">
                                {t.reasoning}
                              </p>
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
                  <td colSpan={8} className="px-6 py-16 text-center text-sm text-[#9CA3AF]">
                    No tasks match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
