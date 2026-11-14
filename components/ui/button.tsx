import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  TouchableOpacityProps,
  View,
} from "react-native";
import { cn } from "@/lib/utils";

export interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Button({
  title,
  variant = "primary",
  size = "md",
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  className,
  ...props
}: ButtonProps) {
  const baseStyles = "flex-row items-center justify-center rounded-2xl active:opacity-85";

  const sizeStyles = {
    sm: "py-2 px-3",
    md: "py-3.5 px-5",
    lg: "py-4 px-6",
  }[size];

  const variantStyles = {
    primary: "bg-emerald-600 active:bg-emerald-700",
    secondary: "bg-slate-100 dark:bg-slate-800",
    outline: "border border-slate-300 dark:border-slate-700 bg-transparent",
    ghost: "bg-transparent",
    danger: "bg-rose-600 active:bg-rose-700",
  }[variant];

  const textVariantStyles = {
    primary: "text-white font-semibold",
    secondary: "text-slate-900 dark:text-slate-100 font-semibold",
    outline: "text-slate-800 dark:text-slate-200 font-medium",
    ghost: "text-slate-600 dark:text-slate-300 font-medium",
    danger: "text-white font-semibold",
  }[variant];

  const textSizeStyles = {
    sm: "text-xs",
    md: "text-base",
    lg: "text-lg",
  }[size];

  const isDisabled = disabled || isLoading;

  return (
    <TouchableOpacity
      className={cn(
        baseStyles,
        sizeStyles,
        variantStyles,
        isDisabled && "opacity-50",
        className
      )}
      disabled={isDisabled}
      accessibilityRole="button"
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={variant === "primary" || variant === "danger" ? "#ffffff" : "#10b981"}
        />
      ) : (
        <View className="flex-row items-center justify-center gap-2">
          {leftIcon}
          <Text className={cn(textVariantStyles, textSizeStyles)}>{title}</Text>
          {rightIcon}
        </View>
      )}
    </TouchableOpacity>
  );
}

