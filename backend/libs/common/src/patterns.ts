export const AUTH_PATTERNS = {
  LOGIN: 'auth.login',
} as const;

export const EMPLOYEE_PATTERNS = {
  GET_ME: 'employee.get_me',
  UPDATE_ME: 'employee.update_me',
  LIST: 'employee.list',
  GET: 'employee.get',
  CREATE: 'employee.create',
  UPDATE: 'employee.update',
} as const;

export const ATTENDANCE_PATTERNS = {
  CLOCK: 'attendance.clock',
  SUMMARY: 'attendance.summary',
  LIST_ALL: 'attendance.list_all',
} as const;

export const QUEUE_NAMES = {
  AUDIT_LOG: 'audit.log',
} as const;

export const SERVICES = {
  EMPLOYEE: 'EMPLOYEE_SERVICE',
  ATTENDANCE: 'ATTENDANCE_SERVICE',
} as const;
