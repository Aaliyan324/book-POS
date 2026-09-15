export type Role = 'ADMIN' | 'MANAGER' | 'EMPLOYEE';

export const PERMISSIONS = {
  ADMIN: [
    'dashboard',
    'pos',
    'sales',
    'books',
    'inventory',
    'customers',
    'employees',
    'payments',
    'reports',
    'expenses',
    'returns',
    'notifications',
    'settings',
    'audit_logs',
  ],
  MANAGER: [
    'dashboard',
    'pos',
    'sales',
    'books',
    'inventory',
    'customers',
    'payments',
    'reports',
    'expenses',
    'returns',
    'notifications',
  ],
  EMPLOYEE: [
    'pos',
    'sales',
    'books',
    'customers',
    'payments',
    'notifications',
  ],
};

export function hasPermission(role: Role, pageOrFeature: string): boolean {
  if (role === 'ADMIN') return true;
  const allowed = PERMISSIONS[role] || [];
  return allowed.includes(pageOrFeature);
}

export function canManageEmployees(role: Role): boolean {
  return role === 'ADMIN';
}

export function canManageSettings(role: Role): boolean {
  return role === 'ADMIN';
}

export function canViewAuditLogs(role: Role): boolean {
  return role === 'ADMIN';
}

export function canViewExpenses(role: Role): boolean {
  return role === 'ADMIN' || role === 'MANAGER';
}
