/**
 * Employees + Attendance + Salary API.
 *
 * The backend stores Employee.role using the same Role enum as users
 * (owner/customer excluded by validation). Server timestamps are ISO
 * strings; mobile types use unix-ms — translate at the boundary.
 */

import { apiRequest } from './client';
import type {
  AttendanceEntry,
  Branch,
  Employee,
  EmployeeRole,
  EmploymentType,
  SalaryDisbursement,
} from '../employees/types';

export type ApiEmployee = {
  id: string;
  name: string;
  phone: string;
  role: EmployeeRole;
  branchSlug: string;
  employmentType: EmploymentType;
  monthlySalary: number | null;
  hourlyRate: number | null;
  active: boolean;
  hiredAt: string;
  notes: string | null;
  linkedUserId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ApiAttendance = {
  id: string;
  employeeId: string;
  date: string;
  checkInAt: string;
  checkOutAt: string | null;
  note: string | null;
  createdAt: string;
};

export type ApiDisbursement = {
  id: string;
  employeeId: string;
  period: string;
  amount: number;
  paidAt: string;
  paidById: string | null;
  notes: string | null;
};

export function toEmployee(api: ApiEmployee): Employee {
  return {
    id: api.id,
    name: api.name,
    phone: api.phone,
    role: api.role,
    branch: api.branchSlug as Branch,
    employmentType: api.employmentType,
    monthlySalary: api.monthlySalary ?? undefined,
    hourlyRate: api.hourlyRate ?? undefined,
    active: api.active,
    hiredAt: Date.parse(api.hiredAt),
    notes: api.notes ?? undefined,
    linkedUserId: api.linkedUserId ?? undefined,
  };
}

export function toAttendance(api: ApiAttendance): AttendanceEntry {
  return {
    id: api.id,
    employeeId: api.employeeId,
    date: api.date,
    checkInAt: Date.parse(api.checkInAt),
    checkOutAt: api.checkOutAt ? Date.parse(api.checkOutAt) : null,
    note: api.note ?? undefined,
  };
}

export function toDisbursement(api: ApiDisbursement): SalaryDisbursement {
  return {
    id: api.id,
    employeeId: api.employeeId,
    period: api.period,
    amount: api.amount,
    paidAt: Date.parse(api.paidAt),
    notes: api.notes ?? undefined,
  };
}

// ---------- Employees ----------

export type ListEmployeesFilter = {
  branchSlug?: string;
  includeInactive?: boolean;
};

export async function listEmployeesApi(filter: ListEmployeesFilter = {}) {
  const p = new URLSearchParams();
  if (filter.branchSlug) p.set('branchSlug', filter.branchSlug);
  if (filter.includeInactive) p.set('includeInactive', 'true');
  const qs = p.toString();
  const rows = await apiRequest<ApiEmployee[]>(`/employees${qs ? '?' + qs : ''}`);
  return rows.map(toEmployee);
}

export type CreateEmployeeInput = {
  name: string;
  phone: string;
  role: EmployeeRole;
  branchSlug?: string;
  employmentType: EmploymentType;
  monthlySalary?: number;
  hourlyRate?: number;
  notes?: string;
  linkedUserId?: string;
};

export async function createEmployeeApi(input: CreateEmployeeInput) {
  const row = await apiRequest<ApiEmployee>('/employees', {
    method: 'POST',
    body: input,
  });
  return toEmployee(row);
}

export type UpdateEmployeeInput = Partial<{
  name: string;
  phone: string;
  role: EmployeeRole;
  employmentType: EmploymentType;
  monthlySalary: number;
  hourlyRate: number;
  active: boolean;
  notes: string;
  linkedUserId: string;
}>;

export async function updateEmployeeApi(id: string, input: UpdateEmployeeInput) {
  const row = await apiRequest<ApiEmployee>(`/employees/${id}`, {
    method: 'PATCH',
    body: input,
  });
  return toEmployee(row);
}

// ---------- Attendance ----------

export async function checkInApi(employeeId: string, note?: string) {
  const row = await apiRequest<ApiAttendance>(`/employees/${employeeId}/check-in`, {
    method: 'POST',
    body: { note },
  });
  return toAttendance(row);
}

export async function checkOutApi(employeeId: string) {
  const row = await apiRequest<ApiAttendance>(`/employees/${employeeId}/check-out`, {
    method: 'POST',
  });
  return toAttendance(row);
}

export type ListAttendanceFilter = {
  date?: string;
  employeeId?: string;
  branchSlug?: string;
};

export async function listAttendanceApi(filter: ListAttendanceFilter = {}) {
  const p = new URLSearchParams();
  if (filter.date) p.set('date', filter.date);
  if (filter.employeeId) p.set('employeeId', filter.employeeId);
  if (filter.branchSlug) p.set('branchSlug', filter.branchSlug);
  const qs = p.toString();
  const rows = await apiRequest<ApiAttendance[]>(`/employees/attendance${qs ? '?' + qs : ''}`);
  return rows.map(toAttendance);
}

// ---------- Salary disbursements ----------

export type RecordDisbursementInput = {
  /** yyyy-mm */
  period: string;
  amount: number;
  notes?: string;
};

export async function recordDisbursementApi(
  employeeId: string,
  input: RecordDisbursementInput,
) {
  const row = await apiRequest<ApiDisbursement>(
    `/employees/${employeeId}/disbursements`,
    { method: 'POST', body: input },
  );
  return toDisbursement(row);
}

export type ListDisbursementsFilter = {
  employeeId?: string;
  branchSlug?: string;
};

export async function listDisbursementsApi(filter: ListDisbursementsFilter = {}) {
  const p = new URLSearchParams();
  if (filter.employeeId) p.set('employeeId', filter.employeeId);
  if (filter.branchSlug) p.set('branchSlug', filter.branchSlug);
  const qs = p.toString();
  const rows = await apiRequest<ApiDisbursement[]>(`/employees/disbursements${qs ? '?' + qs : ''}`);
  return rows.map(toDisbursement);
}
