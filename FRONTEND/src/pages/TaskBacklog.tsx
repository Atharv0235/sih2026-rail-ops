import { useAuthStore } from '../store/useAuthStore';
import { TaskBacklog as RailTaskBacklog } from '../components/rail/task-backlog';
import type { Department } from '../components/rail/task-backlog';

export function TaskBacklog() {
  const role = useAuthStore(s => s.role) as "CONTROLLER" | "ENGINEER";
  const department = (useAuthStore(s => s.department) || "ALL") as Department;

  return (
    <div className="p-8">
      <RailTaskBacklog role={role} department={department} />
    </div>
  );
}
