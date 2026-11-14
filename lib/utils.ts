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
