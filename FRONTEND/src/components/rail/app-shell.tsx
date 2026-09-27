import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, ChevronDown, ListTodo, Radio, BarChart2, LayoutDashboard, TrainFront } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Department, Role } from "./task-backlog";

const navigation = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/" },
  { label: "Task Backlog", icon: ListTodo, to: "/backlog" },
  { label: "Block Planner", icon: CalendarDays, to: "/planner" },
  { label: "Live Feed", icon: Radio, to: "/live", controllerOnly: true },
  { label: "Reports", icon: BarChart2, to: "/reports" },
] as const;

export function RailOpsApp({ page, children }: { page: "backlog" | "planner"; children: (state: { role: Role; department: Department }) => ReactNode }) {
  const [role, setRole] = useState<Role>("CONTROLLER");
  const [department, setDepartment] = useState<Department>("ALL");
  const activePath = page === "backlog" ? "/backlog" : "/planner";

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#111827]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-gray-100 bg-white lg:flex">
        <div className="flex h-20 items-center gap-3 px-6"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#14C9A0] text-[#111827]"><TrainFront className="h-5 w-5" /></span><div><p className="text-lg font-extrabold">RAIL-OPS</p><p className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Control Centre</p></div></div>
        <nav className="flex flex-1 flex-col gap-2 px-2 py-5">
          {navigation.filter((n) => !n.controllerOnly || role === "CONTROLLER").map((item) => {
            const active = item.to === activePath;
            return <Link key={item.label} to={item.to} className={cn("mx-2 flex items-center gap-3 rounded-lg border-l-4 px-4 py-3 text-sm transition-colors duration-200", active ? "border-[#14C9A0] bg-[#14C9A0]/10 font-bold text-[#14C9A0]" : "border-transparent font-medium text-[#6B7280] hover:bg-gray-50 hover:text-[#111827]")}><item.icon className="h-[18px] w-[18px]" />{item.label}</Link>;
          })}
        </nav>
        <div className="border-t border-gray-100 p-5"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#111827] text-xs font-bold text-white">CC</span><div><p className="text-sm font-bold">Chief Controller</p><p className="text-xs text-[#9CA3AF]">North Central Rail</p></div></div></div>
      </aside>
      <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-gray-100 bg-white/95 px-5 backdrop-blur lg:ml-[248px] lg:px-8">
        <div><p className="text-sm font-bold lg:text-base">Operations Command</p><p className="hidden text-xs text-[#9CA3AF] sm:block">Sunday, 30 August 2026 · Live network state</p></div>
        <div className="flex items-center gap-2">
          <label className="relative hidden sm:block"><select value={department} onChange={(e) => setDepartment(e.target.value as Department)} disabled={role === "CONTROLLER"} className="appearance-none rounded-xl border border-gray-200 bg-white py-2 pl-3 pr-8 text-xs font-bold outline-none focus:border-[#14C9A0] disabled:text-[#9CA3AF]"><option value="ALL">All departments</option><option value="TMS">TMS · Track</option><option value="SMMS">SMMS · Signal</option><option value="TDMS">TDMS · Traction</option></select><ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9CA3AF]" /></label>
          <label className="relative"><select value={role} onChange={(e) => { const next = e.target.value as Role; setRole(next); if (next === "ENGINEER" && department === "ALL") setDepartment("TMS"); if (next === "CONTROLLER") setDepartment("ALL"); }} className="appearance-none rounded-xl border border-gray-200 bg-white py-2 pl-3 pr-8 text-xs font-bold outline-none focus:border-[#14C9A0]"><option value="CONTROLLER">Controller</option><option value="ENGINEER">Engineer</option></select><ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9CA3AF]" /></label>
        </div>
      </header>
      <main className="px-5 py-7 lg:ml-[248px] lg:px-8 lg:py-9">{children({ role, department })}</main>
      <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-gray-100 bg-white p-2 lg:hidden">
        {navigation.slice(1, 3).map((item) => <Link key={item.label} to={item.to} className={cn("flex flex-1 flex-col items-center gap-1 rounded-lg py-2 text-[11px] font-bold", item.to === activePath ? "bg-[#14C9A0]/10 text-[#14C9A0]" : "text-[#6B7280]")}><item.icon className="h-5 w-5" />{item.label}</Link>)}
      </nav>
    </div>
  );
}