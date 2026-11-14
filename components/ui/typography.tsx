import React from "react";
import { Text, TextProps } from "react-native";
import { cn, formatCurrencyFromPaise } from "@/lib/utils";

interface TypographyProps extends TextProps {
  children: React.ReactNode;
  className?: string;
}

export function Heading({ children, className, ...props }: TypographyProps) {
  return (
    <Text
      className={cn(
        "text-2xl font-bold text-slate-900 dark:text-slate-50 tracking-tight",
        className
      )}
      {...props}
    >
      {children}
    </Text>
  );
}

export function Subheading({ children, className, ...props }: TypographyProps) {
  return (
    <Text
      className={cn(
        "text-lg font-semibold text-slate-800 dark:text-slate-100",
        className
      )}
      {...props}
    >
      {children}
    </Text>
  );
}

export function Body({ children, className, ...props }: TypographyProps) {
  return (
    <Text
      className={cn("text-base text-slate-600 dark:text-slate-300", className)}
      {...props}
    >
      {children}
    </Text>
  );
}

export function Caption({ children, className, ...props }: TypographyProps) {
  return (
    <Text
      className={cn("text-xs text-slate-400 dark:text-slate-500", className)}
      {...props}
    >
      {children}
    </Text>
  );
}

interface FinancialAmountProps extends TextProps {
  amountPaise: number;
  type?: "income" | "expense" | "neutral";
  showDecimals?: boolean;
  prefix?: string;
  className?: string;
}

export function FinancialAmount({
  amountPaise,
  type = "neutral",
  showDecimals = true,
  prefix,
  className,
  ...props
}: FinancialAmountProps) {
  const formatted = formatCurrencyFromPaise(Math.abs(amountPaise), {
    showDecimals,
  });

  const sign =
    prefix !== undefined
      ? prefix
      : type === "income"
      ? "+"
      : type === "expense"
      ? "-"
      : "";

  const colorStyle =
    type === "income"
      ? "text-emerald-600 dark:text-emerald-400"
      : type === "expense"
      ? "text-rose-600 dark:text-rose-400"
      : "text-slate-900 dark:text-slate-50";

  return (
    <Text
      className={cn("font-bold text-base tracking-tight", colorStyle, className)}
      {...props}
    >
      {sign}
      {formatted}
    </Text>
  );
}

