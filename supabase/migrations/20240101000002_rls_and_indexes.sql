-- ==============================================================================
-- MIGRATION 2: Performance Indexes & Row Level Security (RLS)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. INDEXES FOR HIGH-PERFORMANCE QUERYING
-- ------------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_is_system ON public.categories(is_system);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON public.transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON public.transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_budgets_user_month_year ON public.budgets(user_id, year, month);

-- ------------------------------------------------------------------------------
-- 2. ENABLE ROW LEVEL SECURITY
-- ------------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 3. PROFILES POLICIES
-- ------------------------------------------------------------------------------

CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete their own profile"
    ON public.profiles FOR DELETE
    USING (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- 4. ACCOUNTS POLICIES
-- ------------------------------------------------------------------------------

CREATE POLICY "Users can view their own accounts"
    ON public.accounts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own accounts"
    ON public.accounts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own accounts"
    ON public.accounts FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own accounts"
    ON public.accounts FOR DELETE
    USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 5. CATEGORIES POLICIES
-- ------------------------------------------------------------------------------

-- Users can view system categories OR their own custom categories
CREATE POLICY "Users can view system and own categories"
    ON public.categories FOR SELECT
    USING (is_system = true OR auth.uid() = user_id);

-- Users can only insert non-system categories owned by themselves
CREATE POLICY "Users can insert custom categories"
    ON public.categories FOR INSERT
    WITH CHECK (auth.uid() = user_id AND is_system = false);

-- Users can only update their own custom categories
CREATE POLICY "Users can update own custom categories"
    ON public.categories FOR UPDATE
    USING (auth.uid() = user_id AND is_system = false)
    WITH CHECK (auth.uid() = user_id AND is_system = false);

-- Users can only delete their own custom categories
CREATE POLICY "Users can delete own custom categories"
    ON public.categories FOR DELETE
    USING (auth.uid() = user_id AND is_system = false);

-- ------------------------------------------------------------------------------
-- 6. TRANSACTIONS POLICIES
-- ------------------------------------------------------------------------------

CREATE POLICY "Users can view their own transactions"
    ON public.transactions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
    ON public.transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions"
    ON public.transactions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions"
    ON public.transactions FOR DELETE
    USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 7. BUDGETS POLICIES
-- ------------------------------------------------------------------------------

CREATE POLICY "Users can view their own budgets"
    ON public.budgets FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own budgets"
    ON public.budgets FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budgets"
    ON public.budgets FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budgets"
    ON public.budgets FOR DELETE
    USING (auth.uid() = user_id);

