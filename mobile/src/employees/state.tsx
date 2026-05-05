/**
 * EmployeesProvider — single source of truth for employees, attendance,
 * and salary disbursements. In-memory until backend ships.
 *
 * Computes hours-worked + earnings on demand from raw attendance entries
 * (cheap because we have small numbers).
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import { demoAttendance, demoEmployees } from './demoData';
import type {
  AttendanceEntry,
  AttendanceTotals,
  Employee,
  EmployeeRole,
  EmploymentType,
  SalaryDisbursement,
} from './types';

type EmployeeInput = {
  name: string;
  phone: string;
  role: EmployeeRole;
  branch: 'timergara' | 'shergarh';
  employmentType: EmploymentType;
  monthlySalary?: number;
  hourlyRate?: number;
  notes?: string;
};

type State = {
  employees: Employee[];
  attendance: AttendanceEntry[];
  disbursements: SalaryDisbursement[];

  /** Convenience lookups */
  employeeById: (id: string) => Employee | undefined;
  employeesByBranch: (branch: 'timergara' | 'shergarh') => Employee[];
  attendanceForDate: (date: string) => AttendanceEntry[];
  attendanceForEmployee: (id: string) => AttendanceEntry[];
  todayEntryForEmployee: (id: string) => AttendanceEntry | undefined;

  /** Returns hours + earnings for a single attendance entry. */
  totalsForEntry: (entry: AttendanceEntry, employee: Employee | undefined) => AttendanceTotals;

  /** Mutations */
  addEmployee: (input: EmployeeInput) => Employee;
  updateEmployee: (id: string, patch: Partial<EmployeeInput>) => void;
  setActive: (id: string, active: boolean) => void;
  checkIn: (employeeId: string, note?: string) => AttendanceEntry | null;
  checkOut: (employeeId: string) => AttendanceEntry | null;
  recordDisbursement: (employeeId: string, period: string, amount: number, notes?: string) => void;
};

const Ctx = createContext<State | undefined>(undefined);

function nextId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
}

function isoDateForNow() {
  return new Date().toISOString().slice(0, 10);
}

export function EmployeesProvider({ children }: PropsWithChildren) {
  const [employees, setEmployees] = useState<Employee[]>(demoEmployees);
  const [attendance, setAttendance] = useState<AttendanceEntry[]>(demoAttendance);
  const [disbursements, setDisbursements] = useState<SalaryDisbursement[]>([]);

  const employeeById = useCallback(
    (id: string) => employees.find((e) => e.id === id),
    [employees]
  );

  const employeesByBranch = useCallback(
    (branch: 'timergara' | 'shergarh') =>
      employees.filter((e) => e.branch === branch),
    [employees]
  );

  const attendanceForDate = useCallback(
    (date: string) => attendance.filter((a) => a.date === date),
    [attendance]
  );

  const attendanceForEmployee = useCallback(
    (id: string) => attendance.filter((a) => a.employeeId === id),
    [attendance]
  );

  const todayEntryForEmployee = useCallback(
    (id: string) => {
      const today = isoDateForNow();
      return attendance.find((a) => a.employeeId === id && a.date === today);
    },
    [attendance]
  );

  const totalsForEntry = useCallback<State['totalsForEntry']>((entry, employee) => {
    if (!entry.checkOutAt) return { hours: 0, earnings: 0 };
    const ms = entry.checkOutAt - entry.checkInAt;
    const hours = Math.max(0, ms / 3_600_000);
    let earnings = 0;
    if (employee?.employmentType === 'hourly' && employee.hourlyRate) {
      earnings = hours * employee.hourlyRate;
    }
    return { hours, earnings };
  }, []);

  const addEmployee = useCallback<State['addEmployee']>((input) => {
    const employee: Employee = {
      id: nextId('emp'),
      name: input.name,
      phone: input.phone,
      role: input.role,
      branch: input.branch,
      employmentType: input.employmentType,
      monthlySalary: input.employmentType === 'salaried' ? input.monthlySalary : undefined,
      hourlyRate: input.employmentType === 'hourly' ? input.hourlyRate : undefined,
      active: true,
      hiredAt: Date.now(),
      notes: input.notes,
    };
    setEmployees((prev) => [...prev, employee]);
    return employee;
  }, []);

  const updateEmployee = useCallback<State['updateEmployee']>((id, patch) => {
    setEmployees((prev) =>
      prev.map((e) =>
        e.id === id
          ? {
              ...e,
              ...patch,
              monthlySalary:
                (patch.employmentType ?? e.employmentType) === 'salaried'
                  ? patch.monthlySalary ?? e.monthlySalary
                  : undefined,
              hourlyRate:
                (patch.employmentType ?? e.employmentType) === 'hourly'
                  ? patch.hourlyRate ?? e.hourlyRate
                  : undefined,
            }
          : e
      )
    );
  }, []);

  const setActive = useCallback<State['setActive']>((id, active) => {
    setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, active } : e)));
  }, []);

  const checkIn = useCallback<State['checkIn']>((employeeId, note) => {
    const today = isoDateForNow();
    const existing = attendance.find(
      (a) => a.employeeId === employeeId && a.date === today
    );
    if (existing) return existing; // already checked in today
    const entry: AttendanceEntry = {
      id: nextId('att'),
      employeeId,
      date: today,
      checkInAt: Date.now(),
      checkOutAt: null,
      note,
    };
    setAttendance((prev) => [...prev, entry]);
    return entry;
  }, [attendance]);

  const checkOut = useCallback<State['checkOut']>((employeeId) => {
    const today = isoDateForNow();
    let updated: AttendanceEntry | null = null;
    setAttendance((prev) =>
      prev.map((a) => {
        if (a.employeeId !== employeeId || a.date !== today || a.checkOutAt !== null) {
          return a;
        }
        updated = { ...a, checkOutAt: Date.now() };
        return updated;
      })
    );
    return updated;
  }, []);

  const recordDisbursement = useCallback<State['recordDisbursement']>(
    (employeeId, period, amount, notes) => {
      const d: SalaryDisbursement = {
        id: nextId('sal'),
        employeeId,
        period,
        amount,
        paidAt: Date.now(),
        notes,
      };
      setDisbursements((prev) => [...prev, d]);
    },
    []
  );

  const value = useMemo<State>(
    () => ({
      employees,
      attendance,
      disbursements,
      employeeById,
      employeesByBranch,
      attendanceForDate,
      attendanceForEmployee,
      todayEntryForEmployee,
      totalsForEntry,
      addEmployee,
      updateEmployee,
      setActive,
      checkIn,
      checkOut,
      recordDisbursement,
    }),
    [
      employees,
      attendance,
      disbursements,
      employeeById,
      employeesByBranch,
      attendanceForDate,
      attendanceForEmployee,
      todayEntryForEmployee,
      totalsForEntry,
      addEmployee,
      updateEmployee,
      setActive,
      checkIn,
      checkOut,
      recordDisbursement,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useEmployees(): State {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useEmployees must be used inside <EmployeesProvider>');
  return ctx;
}
