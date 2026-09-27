import { cn } from '../../lib/utils';
import {
  LayoutDashboard,
  ListTodo,
  CalendarDays,
  MapPin,
  BarChart3,
  Search,
  Train,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

const navItems = [
  { label: 'Dashboard',    icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Task List',    icon: ListTodo,         path: '/backlog'   },
  { label: 'Schedule',     icon: CalendarDays,      path: '/planner'  },
  { label: 'Live Tracking',icon: MapPin,            path: '/live'     },
  { label: 'Reports',      icon: BarChart3,         path: '/reports'  },
];

export function AppSidebar() {
  const displayName = useAuthStore(s => s.displayName);
  const initials = displayName ? displayName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() : 'CC';

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-[260px] flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-gray-200 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-mint text-white">
          <Train className="h-5 w-5" />
        </div>
        <div>
          <div className="text-sm font-black tracking-wider text-charcoal">RAIL-OPS</div>
          <div className="text-[10px] font-semibold tracking-widest text-slate uppercase">Dashboard</div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-6 px-4 py-6 overflow-y-auto">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" />
          <input
            type="text"
            placeholder="Search..."
            className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm text-charcoal placeholder:text-slate focus:outline-none focus:ring-1 focus:ring-mint"
          />
        </div>

        {/* Nav label */}
        <div className="text-[10px] font-bold uppercase tracking-widest text-slate/60 px-2">Main Menu</div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 -mt-4">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-mint-light text-mint'
                    : 'text-slate hover:bg-gray-50 hover:text-charcoal',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={cn('h-[18px] w-[18px]', isActive ? 'text-mint' : 'text-slate')} />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Bottom user area */}
      <div className="p-4 border-t border-gray-100 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-mint-light flex items-center justify-center text-xs font-bold text-mint flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-charcoal truncate">{displayName || 'Chief Controller'}</div>
          <div className="text-[10px] text-slate">On duty</div>
        </div>
      </div>
    </aside>
  );
}
