import React from "react";
import { View, Text, ViewProps } from "react-native";
import { cn } from "@/lib/utils";

export interface BadgeProps extends ViewProps {
  label: string;
  variant?: "default" | "success" | "danger" | "warning" | "info" | "outline";
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
    default: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300",
    success: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300",
    danger: "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300",
    warning: "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300",
    info: "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300",
    outline: "border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300",
  }[variant];

  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs font-semibold",
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

