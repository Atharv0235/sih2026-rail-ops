import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ListTodo,
  CalendarDays,
  Radio,
  BarChart2,
} from "lucide-react";
import { NavLink } from "react-router-dom";

interface SidebarProps {
  role: "CONTROLLER" | "ENGINEER";
  activePath?: string;
}

const navItems = [
  { label: "Dashboard",    icon: LayoutDashboard, href: "/dashboard" },
  { label: "Task Backlog", icon: ListTodo,         href: "/backlog" },
  { label: "Block Planner",icon: CalendarDays,     href: "/planner" },
  { label: "Live Feed",    icon: Radio,             href: "/live", controllerOnly: true },
  { label: "Reports",      icon: BarChart2,         href: "/reports" },
];

export function Sidebar({ role }: SidebarProps) {
  const visibleItems = navItems.filter(
    (item) => !item.controllerOnly || role === "CONTROLLER",
  );

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-[260px] flex-col border-r border-gray-100 bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-gray-100 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#14C9A0] text-white">
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18" />
            <path d="M9 21V9" />
          </svg>
        </div>
        <span className="text-lg font-bold tracking-tight text-[#111827]">
          RAIL-OPS
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 px-2 py-4">
        {visibleItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.href}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg border-l-4 px-4 py-3 text-sm transition-colors duration-200",
                isActive
                  ? "border-[#14C9A0] bg-[#14C9A0]/10 font-bold text-[#14C9A0]"
                  : "border-transparent font-medium text-[#6B7280] hover:bg-gray-50 hover:text-[#111827]",
              )
            }
          >
            <item.icon className="h-[18px] w-[18px]" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
