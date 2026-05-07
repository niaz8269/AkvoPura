/**
 * EmployeesProvider — single source of truth for employees, attendance,
 * and salary disbursements. Backed by /employees endpoints (B-21).
 *
 * - Loads employees + today's attendance + disbursements on mount for
 *   manager/owner roles.
 * - Mutations are optimistic with refresh-on-failure rollback (same
 *   pattern as orders/complaints/subscriptions slices).
 * - Computes hours-worked + earnings on demand from raw attendance
 *   entries (cheap because we have small numbers).
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import { useAuth } from '../auth/AuthContext';
import {
  checkInApi,
  checkOutApi,
  createEmployeeApi,
  listAttendanceApi,
  listDisbursementsApi,
  listEmployeesApi,
  recordDisbursementApi,
  updateEmployeeApi,
} from '../api/employees';
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

  /** Mutations — async; resolve to the persisted record. */
  addEmployee: (input: EmployeeInput) => Promise<Employee>;
  updateEmployee: (id: string, patch: Partial<EmployeeInput>) => Promise<void>;
  setActive: (id: string, active: boolean) => Promise<void>;
  checkIn: (employeeId: string, note?: string) => Promise<AttendanceEntry | null>;
  checkOut: (employeeId: string) => Promise<AttendanceEntry | null>;
  recordDisbursement: (
    employeeId: string,
    period: string,
    amount: number,
    notes?: string,
  ) => Promise<void>;

  /** Pull-to-refresh helpers */
  refresh: () => Promise<void>;
};

const Ctx = createContext<State | undefined>(undefined);

function isoDateForNow() {
  return new Date().toISOString().slice(0, 10);
}

export function EmployeesProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceEntry[]>([]);
  const [disbursements, setDisbursements] = useState<SalaryDisbursement[]>([]);

  const refresh = useCallback(async () => {
    if (!user || (user.role !== 'manager' && user.role !== 'owner')) return;
    const settled = await Promise.allSettled([
      listEmployeesApi({ includeInactive: true }),
      listAttendanceApi(),
      listDisbursementsApi(),
    ]);
    if (settled[0].status === 'fulfilled') setEmployees(settled[0].value);
    if (settled[1].status === 'fulfilled') setAttendance(settled[1].value);
    if (settled[2].status === 'fulfilled') setDisbursements(settled[2].value);
  }, [user]);

  useEffect(() => {
    if (user) refresh();
  }, [user, refresh]);

  // -------- Convenience lookups (unchanged) --------

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

  // -------- Mutations (backend-backed) --------

  const addEmployee = useCallback<State['addEmployee']>(async (input) => {
    const created = await createEmployeeApi({
      name: input.name,
      phone: input.phone,
      role: input.role,
      branchSlug: input.branch,
      employmentType: input.employmentType,
      monthlySalary: input.monthlySalary,
      hourlyRate: input.hourlyRate,
      notes: input.notes,
    });
    setEmployees((prev) => [...prev, created]);
    return created;
  }, []);

  const updateEmployee = useCallback<State['updateEmployee']>(
    async (id, patch) => {
      // Optimistic local merge so the UI updates instantly.
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
      try {
        const updated = await updateEmployeeApi(id, patch);
        setEmployees((prev) => prev.map((e) => (e.id === id ? updated : e)));
      } catch {
        // Revert by refetching all employees on failure.
        refresh();
      }
    },
    [refresh],
  );

  const setActive = useCallback<State['setActive']>(
    async (id, active) => {
      setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, active } : e)));
      try {
        const updated = await updateEmployeeApi(id, { active });
        setEmployees((prev) => prev.map((e) => (e.id === id ? updated : e)));
      } catch {
        refresh();
      }
    },
    [refresh],
  );

  const checkIn = useCallback<State['checkIn']>(
    async (employeeId, note) => {
      try {
        const entry = await checkInApi(employeeId, note);
        // Replace today's entry for this employee, or append.
        setAttendance((prev) => {
          const i = prev.findIndex(
            (a) => a.employeeId === employeeId && a.date === entry.date,
          );
          if (i >= 0) {
            const next = [...prev];
            next[i] = entry;
            return next;
          }
          return [...prev, entry];
        });
        return entry;
      } catch {
        refresh();
        return null;
      }
    },
    [refresh],
  );

  const checkOut = useCallback<State['checkOut']>(
    async (employeeId) => {
      try {
        const entry = await checkOutApi(employeeId);
        setAttendance((prev) =>
          prev.map((a) => (a.id === entry.id ? entry : a)),
        );
        return entry;
      } catch {
        refresh();
        return null;
      }
    },
    [refresh],
  );

  const recordDisbursement = useCallback<State['recordDisbursement']>(
    async (employeeId, period, amount, notes) => {
      try {
        const created = await recordDisbursementApi(employeeId, {
          period,
          amount,
          notes,
        });
        setDisbursements((prev) => [created, ...prev]);
      } catch {
        refresh();
      }
    },
    [refresh],
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
      refresh,
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
      refresh,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useEmployees(): State {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useEmployees must be used inside <EmployeesProvider>');
  return ctx;
}
