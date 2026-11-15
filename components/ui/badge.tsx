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
    default: "bg-[#EFEFEA] text-[#121214]",
    gold: "bg-[#FFC83B] text-[#121214] font-bold",
    success: "bg-emerald-100 text-emerald-800",
    danger: "bg-rose-100 text-rose-800",
    warning: "bg-amber-100 text-amber-800",
    info: "bg-blue-100 text-blue-800",
    dark: "bg-[#121214] text-white font-bold",
    outline: "border border-[#DCDCD5] text-[#121214]",
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


