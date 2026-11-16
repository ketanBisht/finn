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
        "text-2xl font-black text-[#121214] tracking-tight",
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
        "text-lg font-bold text-[#121214]",
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
      className={cn("text-base text-[#52525B]", className)}
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
        "text-[11px] font-bold tracking-wider uppercase text-[#71717A]",
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
      ? "text-emerald-600"
      : type === "expense"
      ? "text-rose-600"
      : "text-[#121214]";

  return (
    <Text
      className={cn("font-black text-base tracking-tight", colorStyle, className)}
      style={[{ color: type === "income" ? "#059669" : type === "expense" ? "#E11D48" : "#121214", opacity: 1 }, props.style]}
      {...props}
    >
      {sign}
      {formatted}
    </Text>
  );
}


