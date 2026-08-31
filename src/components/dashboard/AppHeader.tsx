import { Calendar, ChevronDown, Radio } from 'lucide-react';
import { Link } from 'react-router-dom';

export function AppHeader() {
  return (
    <header className="fixed left-[260px] right-0 top-0 z-20 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-8">
      <h1 className="text-xl font-semibold tracking-tight text-charcoal">Dashboard Overview</h1>

      <div className="flex items-center gap-4">
        {/* Date range */}
        <button className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-charcoal hover:bg-gray-50">
          <Calendar className="h-4 w-4 text-slate" />
          <span>Sep 12, 2026 - Sep 15, 2026</span>
          <ChevronDown className="h-4 w-4 text-slate" />
        </button>

        {/* View live feed */}
        <Link
          to="/live"
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-mint px-4 text-sm font-semibold text-white hover:bg-mint-dark transition-colors"
        >
          <Radio className="h-4 w-4" />
          VIEW LIVE FEED
        </Link>

        {/* Edit preferences */}
        <button className="text-sm font-semibold text-mint hover:text-mint-dark transition-colors">
          EDIT PREFERENCES
        </button>

        {/* User avatar */}
        <div className="h-9 w-9 rounded-full border border-gray-200 bg-mint-light flex items-center justify-center text-xs font-bold text-mint">
          CC
        </div>
      </div>
    </header>
  );
}
