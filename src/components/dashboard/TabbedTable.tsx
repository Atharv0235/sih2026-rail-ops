import { useState } from 'react';
import { Search, Plus } from 'lucide-react';

const tabs = [
  { label: 'Task Backlog', count: 120 },
  { label: 'Active Blocks', count: 21 },
  { label: 'Photos', count: null },
  { label: 'Files', count: 32 },
];

const rows = [
  { id: 'DFT-2026-0841', lead: { name: 'Amit Sharma', email: 'a.sharma@railops.gov.in', initials: 'AS' }, section: 'GWL-JHS', value: 'Rail fracture Km 142', status: 'Pending',  date: 'Sep 10, 2026' },
  { id: 'DFT-2026-0839', lead: { name: 'Rajesh Kumar', email: 'r.kumar@railops.gov.in', initials: 'RK' }, section: 'JHS',     value: 'Track circuit fault',   status: 'Overdue',  date: 'Sep 09, 2026' },
  { id: 'DFT-2026-0837', lead: { name: 'Priya Sharma', email: 'p.sharma@railops.gov.in', initials: 'PS' }, section: 'GWL',    value: 'Point machine sluggish',status: 'Accepted', date: 'Sep 11, 2026' },
  { id: 'DFT-2026-0835', lead: { name: 'Vikram Das',   email: 'v.das@railops.gov.in',   initials: 'VD' }, section: 'ET',     value: 'Section insulator worn',status: 'Pending',  date: 'Sep 10, 2026' },
  { id: 'DFT-2026-0832', lead: { name: 'Neha Gupta',   email: 'n.gupta@railops.gov.in', initials: 'NG' }, section: 'BPL',   value: 'Relay room humidity high',status:'Accepted',  date: 'Sep 12, 2026' },
];

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === 'Accepted' ? 'bg-status-accepted text-status-accepted-text' :
    status === 'Overdue'  ? 'bg-status-overdue text-status-overdue-text' :
    'bg-status-pending text-status-pending-text';

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>
      {status}
    </span>
  );
}

export function TabbedTable() {
  const [activeTab, setActiveTab] = useState('Task Backlog');

  return (
    <section className="px-8 pb-10">
      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.label}
            onClick={() => setActiveTab(tab.label)}
            className={`relative flex items-center gap-2 pb-3 text-sm font-medium transition-colors ${
              activeTab === tab.label ? 'text-charcoal' : 'text-slate hover:text-charcoal'
            }`}
          >
            {tab.label}
            {tab.count !== null && (
              <span className={`rounded-full px-2 py-0.5 text-xs ${
                activeTab === tab.label ? 'bg-mint-light text-mint' : 'bg-gray-100 text-slate'
              }`}>
                {tab.count}
              </span>
            )}
            {activeTab === tab.label && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-mint" />
            )}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" />
          <input
            type="text"
            placeholder="Search defects, sections, leads..."
            className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm text-charcoal placeholder:text-slate focus:outline-none focus:ring-1 focus:ring-mint"
          />
        </div>

        <div className="flex items-center gap-3">
          <select className="h-10 w-44 rounded-lg border border-gray-200 bg-white px-3 text-sm text-charcoal focus:outline-none focus:ring-1 focus:ring-mint">
            <option value="criticality">Sort by Criticality</option>
            <option value="date">Sort by Date</option>
            <option value="section">Sort by Section</option>
          </select>
          <button className="inline-flex h-10 items-center gap-2 rounded-lg border border-mint px-4 text-sm font-semibold text-mint hover:bg-mint-light transition-colors">
            <Plus className="h-4 w-4" />
            Create Block
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-hidden rounded-2xl bg-white shadow-sm border border-gray-100">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="py-4 px-4 w-12"><input type="checkbox" className="rounded" /></th>
              <th className="py-4 px-3 text-xs font-semibold uppercase tracking-wide text-slate">Defect ID</th>
              <th className="py-4 px-3 text-xs font-semibold uppercase tracking-wide text-slate">Department Lead</th>
              <th className="py-4 px-3 text-xs font-semibold uppercase tracking-wide text-slate">Section</th>
              <th className="py-4 px-3 text-xs font-semibold uppercase tracking-wide text-slate">Description</th>
              <th className="py-4 px-3 text-xs font-semibold uppercase tracking-wide text-slate">Status</th>
              <th className="py-4 px-3 text-xs font-semibold uppercase tracking-wide text-slate">Date</th>
              <th className="py-4 px-3 w-20 text-xs font-semibold uppercase tracking-wide text-slate">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="py-4 px-4"><input type="checkbox" className="rounded" /></td>
                <td className="py-4 px-3 text-sm font-medium text-charcoal">{row.id}</td>
                <td className="py-4 px-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-mint-light flex items-center justify-center text-xs font-bold text-mint flex-shrink-0">
                      {row.lead.initials}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-charcoal">{row.lead.name}</p>
                      <p className="text-xs text-slate">{row.lead.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-3 text-sm text-charcoal">{row.section}</td>
                <td className="py-4 px-3 text-sm text-charcoal">{row.value}</td>
                <td className="py-4 px-3"><StatusBadge status={row.status} /></td>
                <td className="py-4 px-3 text-sm text-slate">{row.date}</td>
                <td className="py-4 px-3">
                  <button className="inline-flex h-8 items-center rounded-lg bg-mint px-3 text-xs font-semibold text-white hover:bg-mint-dark transition-colors">
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
