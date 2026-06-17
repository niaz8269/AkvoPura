-- Drop attendance + salary disbursement first (have FKs to employees)
DROP TABLE IF EXISTS "attendance";
DROP TABLE IF EXISTS "salary_disbursements";

-- Drop employees table
DROP TABLE IF EXISTS "employees";

-- Drop the employment type enum
DROP TYPE IF EXISTS "EmploymentType";
