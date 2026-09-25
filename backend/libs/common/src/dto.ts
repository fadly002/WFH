export type Role = 'ADMIN' | 'EMPLOYEE';
export type AttendanceType = 'MASUK' | 'PULANG';

export interface ActorContext {
  userId: string;
  email: string;
  role: Role;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface UpdateMyProfilePayload {
  actor: ActorContext;
  phone?: string;
  password?: string;
  photoUrl?: string;
}

export interface CreateEmployeePayload {
  actor: ActorContext;
  name: string;
  email: string;
  password: string;
  position: string;
  phone: string;
  photoUrl?: string;
}

export interface UpdateEmployeePayload {
  actor: ActorContext;
  employeeId: string;
  name?: string;
  email?: string;
  password?: string;
  position?: string;
  phone?: string;
  photoUrl?: string;
}

export interface ClockPayload {
  actor: ActorContext;
  type: AttendanceType;
}

export interface DateRangePayload {
  actor: ActorContext;
  from: string;
  to: string;
}

export interface AdminAttendanceQuery {
  actor: ActorContext;
  from?: string;
  to?: string;
  employeeId?: string;
}

export interface AuditJobPayload {
  action: string;
  entity: string;
  entityId: string;
  actorId?: string;
  actorEmail?: string;
  payload: Record<string, unknown>;
}
