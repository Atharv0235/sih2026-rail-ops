import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, ChevronDown, Radio } from "lucide-react";

export function Header() {
  return (
    <header
      style={{ left: 260 }}
      className="fixed right-0 top-0 z-20 flex h-16 items-center justify-between border-b border-gray-100 bg-white px-8 shadow-sm"
    >
      <h1 className="text-xl font-semibold tracking-tight text-[#111827]">
        Dashboard Overview
      </h1>

      <div className="flex items-center gap-4">
        {/* Date range picker */}
        <button className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-[#111827] hover:bg-gray-50">
          <Calendar className="h-4 w-4 text-[#6B7280]" />
          <span>Aug 21, 2026 - Aug 29, 2026</span>
          <ChevronDown className="h-4 w-4 text-[#6B7280]" />
        </button>

        {/* View live feed */}
        <Button className="h-9 gap-2 bg-[#14C9A0] px-4 text-sm font-semibold text-white hover:bg-[#0e9e7d]">
          <Radio className="h-4 w-4" />
          VIEW LIVE FEED
        </Button>

        {/* User avatar */}
        <Avatar className="h-9 w-9 border border-gray-200">
          <AvatarImage src="/favicon.ico" alt="User" />
          <AvatarFallback className="bg-[#f2fbf9] text-sm font-semibold text-[#14C9A0]">
            CJ
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
