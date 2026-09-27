import { ArrowUpRight, ClipboardList, Clock, ShieldAlert, TrendingUp } from "lucide-react";

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  leftValue: string;
  leftLabel: string;
  leftColor: string;
  rightValue: string;
  rightLabel: string;
  rightColor: string;
  trend: string;
}

function MetricCard({
  icon,
  label,
  leftValue,
  leftLabel,
  leftColor,
  rightValue,
  rightLabel,
  rightColor,
  trend,
}: MetricCardProps) {
  return (
    <div className="flex flex-col justify-between rounded-[20px] bg-surface p-6 shadow-sm">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-mint-light text-mint">
        {icon}
      </div>

      <p className="text-sm font-medium text-slate">{label}</p>

      <div className="my-4 flex items-end gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${leftColor}`} />
            <span className="text-2xl font-bold tracking-tight text-charcoal">{leftValue}</span>
          </div>
          <p className="mt-1 pl-4 text-xs font-medium text-slate">{leftLabel}</p>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${rightColor}`} />
            <span className="text-2xl font-bold tracking-tight text-charcoal">{rightValue}</span>
          </div>
          <p className="mt-1 pl-4 text-xs font-medium text-slate">{rightLabel}</p>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border pt-4">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-success-text">
          <TrendingUp className="h-4 w-4" />
          {trend}
        </div>
        <a href="#" className="text-sm font-semibold text-mint hover:underline">
          View more
        </a>
      </div>
    </div>
  );
}

export function KpiGrid() {
  return (
    <section className="grid grid-cols-1 gap-6 px-8 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        icon={<ClipboardList className="h-5 w-5" />}
        label="Total Tasks"
        leftValue="22.42k"
        leftLabel="ACCEPTED"
        leftColor="bg-emerald-500"
        rightValue="15.52k"
        rightLabel="PENDING"
        rightColor="bg-amber-400"
        trend="+12.5%"
      />
      <MetricCard
        icon={<Clock className="h-5 w-5" />}
        label="Blocks Scheduled"
        leftValue="18.30k"
        leftLabel="COMPLETED"
        leftColor="bg-emerald-500"
        rightValue="2.84k"
        rightLabel="UPCOMING"
        rightColor="bg-blue-500"
        trend="+8.2%"
      />
      <MetricCard
        icon={<ShieldAlert className="h-5 w-5" />}
        label="Inspections"
        leftValue="9.14k"
        leftLabel="PASSED"
        leftColor="bg-emerald-500"
        rightValue="1.20k"
        rightLabel="FLAGGED"
        rightColor="bg-rose-500"
        trend="+4.1%"
      />

      {/* Critical defects card */}
      <div className="flex flex-col justify-between rounded-[20px] bg-gradient-to-br from-mint to-mint-dark p-6 text-white shadow-sm">
        <div className="flex items-start justify-between">
          <p className="text-sm font-medium text-white/90">Critical Defects</p>
          <ShieldAlert className="h-5 w-5 text-white/80" />
        </div>

        <div className="my-4">
          <span className="text-6xl font-bold tracking-tight">17</span>
          <p className="mt-1 text-sm text-white/80">Require immediate attention</p>
        </div>

        <button className="mt-auto w-full rounded-xl bg-white/20 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/30">
          View Details
        </button>
      </div>
    </section>
  );
}
