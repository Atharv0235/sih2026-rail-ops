import type { User, UserRole, Department } from '../types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock user session state
let currentUser: User | null = null;

export async function login(role: UserRole, department?: Department): Promise<User> {
  // TODO(backend): integrate with actual Auth provider (e.g. JWT exchange)
  await delay(600);
  
  currentUser = {
    id: `usr_${Date.now()}`,
    name: role === 'controller' ? 'Divisional Controller' : `${department} Engineer`,
    role,
    department: role === 'engineer' ? department : undefined,
    division: 'Bhopal' // Default mock division
  };
  
  return currentUser;
}

export async function logout(): Promise<void> {
  await delay(300);
  currentUser = null;
}

export function getCurrentUser(): User | null {
  return currentUser;
}
