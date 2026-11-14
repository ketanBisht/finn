import React from "react";
import { View, Text, ViewProps } from "react-native";
import { cn } from "@/lib/utils";

export interface BadgeProps extends ViewProps {
  label: string;
  variant?: "default" | "gold" | "success" | "danger" | "warning" | "info" | "dark" | "outline";
  size?: "sm" | "md";
  className?: string;
}

export function Badge({
  label,
  variant = "default",
  size = "md",
  className,
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: "bg-[#EFEFEA] dark:bg-charcoal-800 text-[#121214] dark:text-[#EFEFEA]",
    gold: "bg-[#FFC83B] text-[#121214] font-bold",
    success: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300",
    danger: "bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300",
    warning: "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300",
    info: "bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300",
    dark: "bg-[#121214] text-white font-bold",
    outline: "border border-[#DCDCD5] dark:border-charcoal-700 text-[#121214] dark:text-[#EFEFEA]",
  }[variant];

  const sizeStyles = {
    sm: "px-2.5 py-0.5 text-[11px]",
    md: "px-3 py-1 text-xs font-bold",
  }[size];

  return (
    <View
      className={cn(
        "self-start rounded-full flex-row items-center",
        variantStyles.split(" ")[0], // bg class
        className
      )}
      {...props}
    >
      <Text className={cn(sizeStyles, variantStyles)}>
        {label}
      </Text>
    </View>
  );
}


