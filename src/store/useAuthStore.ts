import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Role       = 'CONTROLLER' | 'ENGINEER' | null;
export type Department = 'Track' | 'Signal' | 'Traction' | null;

interface AuthState {
  role:          Role;
  department:    Department;   // only relevant for ENGINEER
  corridor:      string;
  displayName:   string;
  setRole:       (role: Role) => void;
  setDepartment: (dept: Department) => void;
  setCorridor:   (corridor: string) => void;
  setDisplayName:(name: string) => void;
  reset:         () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      role:          null,
      department:    null,
      corridor:      'GWL_JHS',
      displayName:   '',
      setRole:       (role)        => set({ role }),
      setDepartment: (department)  => set({ department }),
      setCorridor:   (corridor)    => set({ corridor }),
      setDisplayName:(displayName) => set({ displayName }),
      reset:         ()            => set({ role: null, department: null, corridor: 'GWL_JHS', displayName: '' }),
    }),
    { name: 'rail-ops-auth' }
  )
);
