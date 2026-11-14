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
        "text-2xl font-black text-[#121214] dark:text-[#F4F4F5] tracking-tight",
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
        "text-lg font-bold text-[#121214] dark:text-[#F4F4F5]",
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
      className={cn("text-base text-[#52525B] dark:text-[#A1A1AA]", className)}
      {...props}
    >
      {children}
    </Text>
  );
}

export function Caption({ children, className, ...props }: TypographyProps) {
  return (
    <Text
      className={cn(
        "text-[11px] font-bold tracking-wider uppercase text-[#71717A] dark:text-[#A1A1AA]",
        className
      )}
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
      : "text-[#121214] dark:text-[#F4F4F5]";

  return (
    <Text
      className={cn("font-black text-base tracking-tight", colorStyle, className)}
      {...props}
    >
      {sign}
      {formatted}
    </Text>
  );
}


