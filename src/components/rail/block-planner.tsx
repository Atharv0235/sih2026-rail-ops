import { useState } from "react";
import { Check, Clock3, Layers, Sparkles, X, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "./task-backlog";

type Granularity = "Daily" | "Weekly" | "Monthly";

type Block = {
  id: string;
  section: string;
  day: string;
  corridor: string;
  start: number;
  duration: number;
  efficiency: string;
  tasks: { id: string; department: "TMS" | "SMMS" | "TDMS"; label: string }[];
};

const HOURS = ["06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00"];
const SECTIONS = ["GWL Yard", "Km 140–145", "JHS Approach", "BPL–ET Mainline"];
const BLOCKS: Block[] = [
  {
    id: "SB-0241", section: "GWL Yard", day: "Mon", corridor: "GWL–JHS", start: 2, duration: 3, efficiency: "2.75x",
    tasks: [
      { id: "DEF-10241", department: "TMS", label: "Turnout geometry correction" },
      { id: "DEF-10233", department: "SMMS", label: "Point machine inspection" },
      { id: "DEF-10218", department: "TDMS", label: "OHE isolator service" },
    ],
  },
  {
    id: "SB-0246", section: "Km 140–145", day: "Tue", corridor: "BPL–ET", start: 5, duration: 2.5, efficiency: "2.40x",
    tasks: [
      { id: "DEF-10241", department: "TMS", label: "Rail wear measurement" },
      { id: "DEF-10192", department: "SMMS", label: "Axle counter calibration" },
      { id: "DEF-10218", department: "TDMS", label: "Contact wire adjustment" },
    ],
  },
  {
    id: "SB-0250", section: "JHS Approach", day: "Wed", corridor: "GWL–JHS", start: 1, duration: 2, efficiency: "2.15x",
    tasks: [
      { id: "DEF-10205", department: "TMS", label: "Ballast profile check" },
      { id: "DEF-10233", department: "SMMS", label: "Signal sighting audit" },
      { id: "DEF-10187", department: "TDMS", label: "Neutral section test" },
    ],
  },
  {
    id: "SB-0254", section: "BPL–ET Mainline", day: "Thu", corridor: "BPL–ET", start: 4, duration: 3.5, efficiency: "2.92x",
    tasks: [
      { id: "DEF-10241", department: "TMS", label: "Tamping and lining" },
      { id: "DEF-10192", department: "SMMS", label: "Relay insulation test" },
      { id: "DEF-10218", department: "TDMS", label: "Catenary maintenance" },
    ],
  },
];

const deptStyle = {
  TMS: { color: "#3B82F6", bg: "rgba(59,130,246,.10)", name: "Track" },
  SMMS: { color: "#10B981", bg: "rgba(16,185,129,.10)", name: "Signal" },
  TDMS: { color: "#F97316", bg: "rgba(249,115,22,.10)", name: "Traction" },
};

function ShadowBlock({ block, onClick }: { block: Block; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{ left: `${(block.start / 8) * 100}%`, width: `${(block.duration / 8) * 100}%` }}
      className="group/block absolute top-1/2 z-[1] h-14 -translate-y-1/2 origin-center cursor-pointer overflow-hidden rounded-lg border border-white bg-white shadow-md transition-all duration-300 hover:z-10 hover:scale-105 hover:shadow-lg"
    >
      <span className="absolute inset-x-0 top-0 h-1/3 bg-[#3B82F6]" />
      <span className="absolute inset-x-0 top-1/3 h-1/3 bg-[#10B981]" />
      <span className="absolute inset-x-0 bottom-0 h-1/3 bg-[#F97316]" />
      <span className="absolute inset-1 flex items-center justify-between rounded bg-white/90 px-2 text-left text-[10px] font-extrabold text-[#111827] backdrop-blur-sm">
        <span className="truncate">{block.id}</span>
        <span className="ml-1 shrink-0">{block.duration * 60}m</span>
      </span>
    </button>
  );
}

export function BlockPlanner({ role }: { role: Role }) {
  const [granularity, setGranularity] = useState<Granularity>("Weekly");
  const [selected, setSelected] = useState<Block | null>(null);
  const [approved, setApproved] = useState<string[]>([]);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#14C9A0]">
            <Sparkles className="h-4 w-4" /> AI-assisted planning
          </div>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[#111827]">AI Shadow Block Planner</h1>
          <p className="mt-1 text-sm text-[#6B7280]">Pack cross-functional work into every possession window.</p>
        </div>
        <div className="flex rounded-xl bg-gray-100 p-1">
          {(["Daily", "Weekly", "Monthly"] as Granularity[]).map((item) => (
            <button
              key={item}
              onClick={() => setGranularity(item)}
              className={cn(
                "rounded-lg px-4 py-2 text-xs font-bold transition-all duration-200",
                granularity === item ? "bg-[#14C9A0] text-[#111827] shadow-sm" : "text-[#6B7280] hover:text-[#111827]",
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="min-w-[980px]">
          <div className="grid grid-cols-[160px_1fr] border-b border-gray-100">
            <div className="flex items-center px-4 py-4 text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF]">Track section</div>
            <div className="grid grid-cols-9">
              {HOURS.map((hour) => <div key={hour} className="border-l border-gray-100 py-4 text-center text-[11px] font-semibold text-[#9CA3AF]">{hour}</div>)}
            </div>
          </div>
          <div className="group/canvas">
            {SECTIONS.map((section) => (
              <div key={section} className="grid grid-cols-[160px_1fr] border-b border-gray-100 last:border-b-0">
                <div className="flex items-center px-4 py-7">
                  <div><p className="text-sm font-bold text-[#111827]">{section}</p><p className="mt-1 text-[11px] text-[#9CA3AF]">Main corridor</p></div>
                </div>
                <div className="relative grid grid-cols-8 bg-[linear-gradient(to_right,#f3f4f6_1px,transparent_1px)] bg-[size:12.5%_100%] group-hover/canvas:[&>button:not(:hover)]:opacity-50">
                  {BLOCKS.filter((b) => b.section === section).map((block) => (
                    <ShadowBlock key={block.id} block={block} onClick={() => setSelected(block)} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-5 text-xs font-medium text-[#6B7280]">
        <span className="font-bold text-[#111827]">Department layers:</span>
        {Object.entries(deptStyle).map(([key, value]) => (
          <span key={key} className="flex items-center gap-2"><span className="h-2.5 w-7 rounded-full" style={{ backgroundColor: value.color }} />{key} / {value.name}</span>
        ))}
        <span className="ml-auto inline-flex items-center gap-2 rounded-full bg-[#14C9A0]/10 px-3 py-1.5 font-bold text-[#14C9A0]"><Layers className="h-3.5 w-3.5" />3 workstreams per block</span>
      </div>

      <div className={cn("fixed inset-0 z-40 bg-[#111827]/30 transition-opacity duration-300", selected ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0")} onClick={() => setSelected(null)} />
      <aside className={cn("fixed inset-y-0 right-0 z-50 flex w-full max-w-96 transform flex-col bg-white shadow-2xl transition-transform duration-300", selected ? "translate-x-0" : "translate-x-full")}>
        {selected && (
          <>
            <div className="border-b border-gray-100 px-6 py-6">
              <div className="flex items-start justify-between gap-4">
                <div><p className="text-xs font-bold uppercase tracking-wider text-[#14C9A0]">{selected.id}</p><h2 className="mt-1 text-xl font-extrabold text-[#111827]">{selected.day} {6 + selected.start * 2}:00 · {selected.corridor}</h2><p className="mt-1 flex items-center gap-1.5 text-sm text-[#6B7280]"><Clock3 className="h-4 w-4" />{selected.duration * 60} minute block</p></div>
                <button aria-label="Close inspector" onClick={() => setSelected(null)} className="rounded-lg p-2 text-[#6B7280] transition-colors hover:bg-gray-100 hover:text-[#111827]"><X className="h-5 w-5" /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="rounded-xl bg-[#14C9A0]/10 p-5"><p className="text-xs font-bold uppercase tracking-wider text-[#0E9E7D]">Shadow efficiency</p><p className="mt-1 text-4xl font-extrabold text-[#111827]">{selected.efficiency}</p><p className="mt-2 text-xs leading-relaxed text-[#6B7280]">Effective maintenance output versus a single-department possession.</p></div>
              <h3 className="mb-3 mt-7 text-sm font-extrabold text-[#111827]">Bundled tasks</h3>
              <div className="space-y-3">
                {selected.tasks.map((task) => {
                  const meta = deptStyle[task.department];
                  return <div key={`${selected.id}-${task.id}-${task.department}`} className="flex gap-3 rounded-xl border border-gray-100 p-4"><span className="mt-1 h-10 w-1 shrink-0 rounded-full" style={{ backgroundColor: meta.color }} /><div><span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ color: meta.color, backgroundColor: meta.bg }}>{task.department}</span><p className="mt-2 text-sm font-bold text-[#111827]">{task.label}</p><p className="mt-1 text-xs text-[#9CA3AF]">{task.id} · {meta.name}</p></div></div>;
                })}
              </div>
            </div>
            <div className="sticky bottom-0 border-t border-gray-100 bg-white p-6">
              {role === "CONTROLLER" ? (
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setApproved((v) => [...new Set([...v, selected.id])])} className="flex items-center justify-center gap-2 rounded-xl bg-[#14C9A0] px-4 py-3 text-sm font-bold text-[#111827] transition-all hover:shadow-lg hover:shadow-[#14C9A0]/40"><Check className="h-4 w-4" />{approved.includes(selected.id) ? "Approved" : "Approve Block"}</button>
                  <button className="flex items-center justify-center gap-2 rounded-xl border border-[#14C9A0] px-4 py-3 text-sm font-bold text-[#111827] transition-colors hover:bg-[#14C9A0]/10"><Wrench className="h-4 w-4" />Modify Tasks</button>
                </div>
              ) : <div className="rounded-xl bg-gray-100 px-4 py-3 text-center text-sm font-semibold text-[#6B7280]">Awaiting Chief Controller Approval</div>}
            </div>
          </>
        )}
      </aside>
    </section>
  );
}