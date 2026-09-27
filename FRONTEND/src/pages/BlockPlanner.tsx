import { useAuthStore } from '../store/useAuthStore';
import { BlockPlanner as RailBlockPlanner } from '../components/rail/block-planner';

export function BlockPlanner() {
  const role = useAuthStore(s => s.role) as "CONTROLLER" | "ENGINEER";

  return (
    <div className="p-8">
      <RailBlockPlanner role={role} />
    </div>
  );
}
