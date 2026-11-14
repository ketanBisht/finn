-- ==============================================================================
-- MIGRATION 4: Seed Default System Categories
-- ==============================================================================

-- Seed Expense Categories
INSERT INTO public.categories (name, type, icon, color, is_system, user_id)
VALUES
    ('Food', 'expense', 'Utensils', '#f97316', true, NULL),
    ('Shopping', 'expense', 'ShoppingBag', '#ec4899', true, NULL),
    ('Transportation', 'expense', 'Car', '#3b82f6', true, NULL),
    ('Entertainment', 'expense', 'Film', '#a855f7', true, NULL),
    ('Bills', 'expense', 'Receipt', '#eab308', true, NULL),
    ('Healthcare', 'expense', 'HeartPulse', '#ef4444', true, NULL),
    ('Education', 'expense', 'GraduationCap', '#06b6d4', true, NULL),
    ('Groceries', 'expense', 'ShoppingCart', '#84cc16', true, NULL),
    ('Travel', 'expense', 'Plane', '#6366f1', true, NULL),
    ('Personal Care', 'expense', 'Smile', '#14b8a6', true, NULL),
    ('Other', 'expense', 'MoreHorizontal', '#64748b', true, NULL)
ON CONFLICT DO NOTHING;

-- Seed Income Categories
INSERT INTO public.categories (name, type, icon, color, is_system, user_id)
VALUES
    ('Salary', 'income', 'Briefcase', '#10b981', true, NULL),
    ('Freelancing', 'income', 'Laptop', '#06b6d4', true, NULL),
    ('Business', 'income', 'TrendingUp', '#8b5cf6', true, NULL),
    ('Investments', 'income', 'PiggyBank', '#f59e0b', true, NULL),
    ('Gifts', 'income', 'Gift', '#ec4899', true, NULL),
    ('Other', 'income', 'PlusCircle', '#64748b', true, NULL)
ON CONFLICT DO NOTHING;

