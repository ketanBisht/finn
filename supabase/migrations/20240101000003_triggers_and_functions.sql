-- ==============================================================================
-- MIGRATION 3: Automated Triggers and Financial Functions
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. UPDATED_AT TIMESTAMP TRIGGER FUNCTION
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_accounts_updated_at
    BEFORE UPDATE ON public.accounts
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_transactions_updated_at
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_budgets_updated_at
    BEFORE UPDATE ON public.budgets
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 2. AUTOMATIC PROFILE & INITIAL ACCOUNTS ON USER REGISTRATION
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_name TEXT;
BEGIN
    user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));

    -- Insert profile
    INSERT INTO public.profiles (id, email, full_name, currency)
    VALUES (NEW.id, NEW.email, user_name, 'INR');

    -- Seed 2 default accounts for immediate use: Cash and Bank
    INSERT INTO public.accounts (user_id, name, type, opening_balance_paise, current_balance_paise, currency)
    VALUES 
        (NEW.id, 'Cash', 'cash', 0, 0, 'INR'),
        (NEW.id, 'Primary Bank', 'savings', 0, 0, 'INR');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 3. FINANCIAL INTEGRITY: AUTOMATIC ACCOUNT BALANCE UPDATER
-- Keeps account current_balance_paise perfectly synchronized with transactions
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_transaction_balance_change()
RETURNS TRIGGER AS $$
BEGIN
    -- REVERT OLD TRANSACTION IMPACT (ON UPDATE OR DELETE)
    IF (TG_OP = 'UPDATE' OR TG_OP = 'DELETE') THEN
        IF OLD.type = 'income' THEN
            UPDATE public.accounts
            SET current_balance_paise = current_balance_paise - OLD.amount_paise
            WHERE id = OLD.account_id;
        ELSIF OLD.type = 'expense' THEN
            UPDATE public.accounts
            SET current_balance_paise = current_balance_paise + OLD.amount_paise
            WHERE id = OLD.account_id;
        ELSIF OLD.type = 'transfer' THEN
            -- Source account: add back the transferred amount
            UPDATE public.accounts
            SET current_balance_paise = current_balance_paise + OLD.amount_paise
            WHERE id = OLD.account_id;
            -- Destination account: deduct the transferred amount
            IF OLD.destination_account_id IS NOT NULL THEN
                UPDATE public.accounts
                SET current_balance_paise = current_balance_paise - OLD.amount_paise
                WHERE id = OLD.destination_account_id;
            END IF;
        END IF;
    END IF;

    -- APPLY NEW TRANSACTION IMPACT (ON INSERT OR UPDATE)
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
        IF NEW.type = 'income' THEN
            UPDATE public.accounts
            SET current_balance_paise = current_balance_paise + NEW.amount_paise
            WHERE id = NEW.account_id;
        ELSIF NEW.type = 'expense' THEN
            UPDATE public.accounts
            SET current_balance_paise = current_balance_paise - NEW.amount_paise
            WHERE id = NEW.account_id;
        ELSIF NEW.type = 'transfer' THEN
            -- Source account: deduct the transferred amount
            UPDATE public.accounts
            SET current_balance_paise = current_balance_paise - NEW.amount_paise
            WHERE id = NEW.account_id;
            -- Destination account: credit the transferred amount
            IF NEW.destination_account_id IS NOT NULL THEN
                UPDATE public.accounts
                SET current_balance_paise = current_balance_paise + NEW.amount_paise
                WHERE id = NEW.destination_account_id;
            END IF;
        END IF;
    END IF;

    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_transaction_balance_sync
    AFTER INSERT OR UPDATE OR DELETE ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION public.handle_transaction_balance_change();

