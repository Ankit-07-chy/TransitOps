import { Role } from './types';

/**
 * Frontend mirror of the server-side RBAC (spec Section 4). The server enforces
 * these regardless — this only hides/disables controls the user can't use.
 */
export const can = {
  manageVehicles: (role?: Role) => role === 'FLEET_MANAGER',
  manageDrivers: (role?: Role) => role === 'SAFETY_OFFICER',
  operateTrips: (role?: Role) => role === 'FLEET_MANAGER' || role === 'DRIVER',
  manageMaintenance: (role?: Role) => role === 'FLEET_MANAGER',
  logFuel: (role?: Role) =>
    role === 'DRIVER' || role === 'FINANCIAL_ANALYST' || role === 'FLEET_MANAGER',
  manageExpenses: (role?: Role) => role === 'FINANCIAL_ANALYST',
  exportReports: (role?: Role) => role === 'FINANCIAL_ANALYST' || role === 'FLEET_MANAGER',
};

export const ROLE_LABELS: Record<Role, string> = {
  FLEET_MANAGER: 'Fleet Manager',
  DRIVER: 'Driver',
  SAFETY_OFFICER: 'Safety Officer',
  FINANCIAL_ANALYST: 'Financial Analyst',
};
