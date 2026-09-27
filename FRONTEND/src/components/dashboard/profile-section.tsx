import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mail, Phone, MapPin } from "lucide-react";

export function ProfileSection() {
  return (
    <section className="flex items-start justify-between bg-surface px-8 py-6">
      {/* Left: Chief Controller */}
      <div className="flex items-center gap-6">
        <Avatar className="h-[120px] w-[120px] border-4 border-mint-light">
          <AvatarImage src="/favicon.ico" alt="Chief Controller" />
          <AvatarFallback className="bg-mint-light text-4xl font-bold text-mint">CC</AvatarFallback>
        </Avatar>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-charcoal">Chief Controller</h2>
            <Badge className="border-0 bg-mint-light px-2.5 py-0.5 text-xs font-semibold text-mint hover:bg-mint-light">
              Active Corridor
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-slate" />
              <span className="text-slate">Email</span>
              <span className="font-medium text-charcoal">controller@railops.gov</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-slate" />
              <span className="text-slate">Phone</span>
              <span className="font-medium text-charcoal">+91 98765 43210</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-slate" />
              <span className="text-slate">Location</span>
              <span className="font-medium text-charcoal">Mumbai Central</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Duty Engineer */}
      <div className="flex items-center gap-4 rounded-2xl border border-border bg-background p-4 shadow-sm">
        <Avatar className="h-10 w-10">
          <AvatarImage src="/favicon.ico" alt="Duty Engineer" />
          <AvatarFallback className="bg-mint-light text-sm font-semibold text-mint">RK</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-semibold text-charcoal">Ravi Kumar</p>
          <p className="text-xs text-slate">Duty Engineer</p>
        </div>
      </div>
    </section>
  );
}
