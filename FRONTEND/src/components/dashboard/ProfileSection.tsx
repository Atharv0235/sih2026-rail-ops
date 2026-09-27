import { Mail, Phone, MapPin } from 'lucide-react';

export function ProfileSection() {
  return (
    <section className="flex items-start justify-between bg-white px-8 py-6">
      {/* Left: Chief Controller */}
      <div className="flex items-center gap-6">
        <div className="h-[120px] w-[120px] rounded-full border-4 border-mint-light bg-mint-light flex items-center justify-center flex-shrink-0 overflow-hidden">
          <span className="text-4xl font-bold text-mint">CC</span>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-charcoal">Chief Controller</h2>
            <span className="inline-flex items-center rounded-full bg-mint-light px-3 py-0.5 text-xs font-semibold text-mint">
              Active Corridor
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-slate" />
              <span className="text-slate">Email</span>
              <span className="font-medium text-charcoal">controller@railops.gov.in</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-slate" />
              <span className="text-slate">Phone</span>
              <span className="font-medium text-charcoal">+91 11 2338 1234</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-slate" />
              <span className="text-slate">Location</span>
              <span className="font-medium text-charcoal">New Delhi HQ, NCR Division</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Duty Engineer */}
      <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-4 shadow-sm flex-shrink-0">
        <div className="h-10 w-10 rounded-full bg-mint-light flex items-center justify-center text-xs font-bold text-mint flex-shrink-0">
          RK
        </div>
        <div>
          <p className="text-sm font-semibold text-charcoal">Rajesh Kumar</p>
          <p className="text-xs text-slate">Duty Engineer · GWL-JHS</p>
        </div>
      </div>
    </section>
  );
}
