import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { ProfileSection } from "@/components/dashboard/profile-section";
import { KpiGrid } from "@/components/dashboard/kpi-grid";
import { TabbedTableSection } from "@/components/dashboard/tabbed-table";

export function ControllerDashboard() {
  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      {/* Fixed sidebar — 260px wide */}
      <Sidebar role="CONTROLLER" />

      {/* Fixed top header — starts at 260px left */}
      <Header />

      {/* Main content — offset by sidebar width + header height */}
      <main
        style={{ marginLeft: 260, paddingTop: 64 }}
        className="min-h-screen"
      >
        <div className="space-y-6 pb-8">
          <ProfileSection />
          <KpiGrid />
          <TabbedTableSection />
        </div>
      </main>
    </div>
  );
}
