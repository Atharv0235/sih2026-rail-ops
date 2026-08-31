import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Plus } from "lucide-react";

const tabs = [
  { label: "Task Backlog", count: 120 },
  { label: "Active Blocks", count: 21 },
  { label: "Photos", count: null },
  { label: "Files", count: 32 },
];

const rows = [
  {
    id: "DFT-2026-0841",
    lead: { name: "Amit Sharma", email: "a.sharma@railops.gov", initials: "AS" },
    section: "Mumbai - Surat",
    value: "Track Alignment",
    status: "Accepted",
    date: "Aug 29, 2026",
  },
  {
    id: "DFT-2026-0839",
    lead: { name: "Priya Nair", email: "p.nair@railops.gov", initials: "PN" },
    section: "Pune - Solapur",
    value: "Signal Failure",
    status: "Overdue",
    date: "Aug 27, 2026",
  },
  {
    id: "DFT-2026-0837",
    lead: { name: "Rahul Verma", email: "r.verma@railops.gov", initials: "RV" },
    section: "Nashik - Igatpuri",
    value: "Bridge Crack",
    status: "Pending",
    date: "Aug 28, 2026",
  },
  {
    id: "DFT-2026-0835",
    lead: { name: "Sneha Iyer", email: "s.iyer@railops.gov", initials: "SI" },
    section: "Mumbai - Pune",
    value: "Overhead Wire",
    status: "Accepted",
    date: "Aug 26, 2026",
  },
  {
    id: "DFT-2026-0832",
    lead: { name: "Karan Patel", email: "k.patel@railops.gov", initials: "KP" },
    section: "Vadodara - Ahmedabad",
    value: "Level Crossing",
    status: "Pending",
    date: "Aug 25, 2026",
  },
];

function StatusBadge({ status }: { status: string }) {
  const styles =
    status === "Accepted"
      ? "bg-status-accepted text-status-accepted-text"
      : status === "Overdue"
        ? "bg-status-overdue text-status-overdue-text"
        : "bg-status-pending text-status-pending-text";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        styles,
      )}
    >
      {status}
    </span>
  );
}

export function TabbedTableSection() {
  const [activeTab, setActiveTab] = useState("Task Backlog");

  return (
    <section className="px-8 pb-8">
      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.label}
            onClick={() => setActiveTab(tab.label)}
            className={cn(
              "relative flex items-center gap-2 pb-3 text-sm font-medium transition-colors",
              activeTab === tab.label ? "text-charcoal" : "text-slate hover:text-charcoal",
            )}
          >
            {tab.label}
            {tab.count !== null && (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs",
                  activeTab === tab.label ? "bg-mint-light text-mint" : "bg-background text-slate",
                )}
              >
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
          <Input
            type="text"
            placeholder="Search defects, sections, leads..."
            className="h-10 border-border bg-surface pl-9 pr-3 text-sm text-charcoal placeholder:text-slate focus-visible:ring-mint"
          />
        </div>

        <div className="flex items-center gap-3">
          <Select defaultValue="criticality">
            <SelectTrigger className="h-10 w-44 border-border bg-surface text-sm text-charcoal focus:ring-mint">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="criticality">Sort by Criticality</SelectItem>
              <SelectItem value="date">Sort by Date</SelectItem>
              <SelectItem value="section">Sort by Section</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            className="h-10 gap-2 border-mint px-4 text-sm font-semibold text-mint hover:bg-mint-light hover:text-mint"
          >
            <Plus className="h-4 w-4" />
            Create Block
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-hidden rounded-2xl bg-surface shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="w-12">
                <Checkbox aria-label="Select all" />
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate">
                Defect ID
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate">
                Department Lead
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate">
                Section
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate">
                Value
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate">
                Status
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate">
                Date
              </TableHead>
              <TableHead className="w-24 text-xs font-semibold uppercase tracking-wide text-slate">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id} className="border-border">
                <TableCell>
                  <Checkbox aria-label={`Select ${row.id}`} />
                </TableCell>
                <TableCell className="font-medium text-charcoal">{row.id}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src="/favicon.ico" alt={row.lead.name} />
                      <AvatarFallback className="bg-mint-light text-xs font-semibold text-mint">
                        {row.lead.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-charcoal">{row.lead.name}</p>
                      <p className="text-xs text-slate">{row.lead.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-charcoal">{row.section}</TableCell>
                <TableCell className="text-sm text-charcoal">{row.value}</TableCell>
                <TableCell>
                  <StatusBadge status={row.status} />
                </TableCell>
                <TableCell className="text-sm text-slate">{row.date}</TableCell>
                <TableCell>
                  <Button className="h-8 bg-mint px-4 text-xs font-semibold text-white hover:bg-mint-dark">
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
