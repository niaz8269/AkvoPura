-- Add finer-grained expense categories so the owner can distinguish
-- vehicle vs plant maintenance and track marketing / rent / insurance /
-- refreshments separately. "other" is kept and semantically means "owner
-- withdrawal / not a plant operational cost".
ALTER TYPE "ExpenseCategory" ADD VALUE IF NOT EXISTS 'vehicle_maintenance';
ALTER TYPE "ExpenseCategory" ADD VALUE IF NOT EXISTS 'plant_maintenance';
ALTER TYPE "ExpenseCategory" ADD VALUE IF NOT EXISTS 'marketing';
ALTER TYPE "ExpenseCategory" ADD VALUE IF NOT EXISTS 'rent';
ALTER TYPE "ExpenseCategory" ADD VALUE IF NOT EXISTS 'insurance';
ALTER TYPE "ExpenseCategory" ADD VALUE IF NOT EXISTS 'refreshments';
