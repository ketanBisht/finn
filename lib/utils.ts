/**
 * Utility functions for Finn personal finance application.
 */

/**
 * Format amounts stored in integer paise (1 INR = 100 paise) to formatted INR string.
 * Example: 150000 paise -> ₹1,500.00
 */
export function formatCurrencyFromPaise(
  paise: number | bigint,
  options: {
    showDecimals?: boolean;
    includeSymbol?: boolean;
  } = {}
): string {
  const { showDecimals = true, includeSymbol = true } = options;
  const numPaise = typeof paise === "bigint" ? Number(paise) : paise;
  const rupees = numPaise / 100;

  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(rupees);

  return includeSymbol ? `₹${formatted}` : formatted;
}

/**
 * Convert rupee input string or number to integer paise to prevent floating-point rounding issues.
 * Example: "1500.50" -> 150050
 */
export function rupeesToPaise(rupees: number | string): number {
  if (typeof rupees === "string") {
    const cleaned = rupees.replace(/[^0-9.-]/g, "");
    const parsed = parseFloat(cleaned);
    if (isNaN(parsed)) return 0;
    return Math.round(parsed * 100);
  }
  return Math.round(rupees * 100);
}

/**
 * Convert integer paise to rupee number.
 * Example: 150050 -> 1500.5
 */
export function paiseToRupees(paise: number): number {
  return paise / 100;
}

/**
 * Format a Date object to YYYY-MM-DD in local time without UTC offset bugs.
 */
export function formatLocalDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Class name utility for combining Tailwind classes safely.
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Compute the next billing date from a billing day and cycle.
 * Returns YYYY-MM-DD string.
 */
export function computeNextBillingDate(
  billingDay: number,
  cycle: "monthly" | "yearly" | "weekly" | "quarterly"
): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const result = new Date(today);

  if (cycle === "weekly") {
    // next occurrence of that weekday (1=Mon…7=Sun)
    const targetDay = Math.max(1, Math.min(7, billingDay));
    const jsTargetDay = targetDay === 7 ? 0 : targetDay;
    const diff = (jsTargetDay - today.getDay() + 7) % 7 || 7;
    result.setDate(today.getDate() + diff);
  } else if (cycle === "monthly") {
    result.setDate(billingDay);
    if (result <= today) {
      result.setMonth(result.getMonth() + 1);
      result.setDate(billingDay);
    }
  } else if (cycle === "quarterly") {
    result.setDate(billingDay);
    if (result <= today) {
      result.setMonth(result.getMonth() + 3);
      result.setDate(billingDay);
    }
  } else if (cycle === "yearly") {
    result.setDate(billingDay);
    if (result <= today) {
      result.setFullYear(result.getFullYear() + 1);
      result.setDate(billingDay);
    }
  }

  const y = result.getFullYear();
  const m = String(result.getMonth() + 1).padStart(2, "0");
  const d = String(result.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Returns how many days until a YYYY-MM-DD date string (from today).
 * Negative means overdue.
 */
export function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}
