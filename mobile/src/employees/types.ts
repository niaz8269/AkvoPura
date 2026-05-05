/**
 * Employee + Attendance + Salary domain types.
 *
 * Employees can be salaried (fixed monthly) or hourly (rate × hours worked).
 * Attendance is one entry per employee per day with check-in / check-out
 * timestamps; hours-worked + earnings (for hourly) are derived from those.
 */

export type EmployeeRole =
  | 'manager'
  | 'pets_salesman'
  | 'cans_gallons_salesman'
  | 'production_worker'
  | 'driver'
  | 'helper'
  | 'other';

export type EmploymentType = 'salaried' | 'hourly';

export type Branch = 'timergara' | 'shergarh';

export type Employee = {
  id: string;
  name: string;
  phone: string;
  role: EmployeeRole;
  branch: Branch;
  employmentType: EmploymentType;
  /** For salaried employees — full monthly amount in PKR. */
  monthlySalary?: number;
  /** For hourly employees — rate per hour in PKR. */
  hourlyRate?: number;
  active: boolean;
  hiredAt: number;
  notes?: string;
  /** Optional link to a User record (so logged-in users can be matched). */
  linkedUserId?: string;
};

export type AttendanceEntry = {
  id: string;
  employeeId: string;
  /** Calendar date in YYYY-MM-DD (no time component). */
  date: string;
  checkInAt: number;
  checkOutAt: number | null;
  /** Optional manager note (e.g., "Half day", "Late arrival"). */
  note?: string;
};

export type SalaryDisbursement = {
  id: string;
  employeeId: string;
  /** Period the disbursement covers — YYYY-MM. */
  period: string;
  amount: number;
  paidAt: number;
  notes?: string;
};

/** Helper computed at read-time from an AttendanceEntry. */
export type AttendanceTotals = {
  hours: number;
  earnings: number;
};
