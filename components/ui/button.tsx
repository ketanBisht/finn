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
  variant?: "primary" | "gold" | "secondary" | "outline" | "ghost" | "danger";
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
  const baseStyles = "flex-row items-center justify-center rounded-full";

  const sizeStyles = {
    sm: "py-2 px-3.5",
    md: "py-3.5 px-5",
    lg: "py-4 px-6",
  }[size];

  const variantStyles = {
    primary: "bg-[#121214]",
    gold: "bg-[#FFC83B]",
    secondary: "bg-[#EFEFEA] dark:bg-charcoal-800",
    outline: "border border-[#DCDCD5] dark:border-charcoal-700 bg-transparent",
    ghost: "bg-transparent",
    danger: "bg-rose-600",
  }[variant];

  const textVariantStyles = {
    primary: "text-white font-bold",
    gold: "text-[#121214] font-bold",
    secondary: "text-[#121214] dark:text-white font-semibold",
    outline: "text-[#121214] dark:text-white font-semibold",
    ghost: "text-slate-600 dark:text-slate-300 font-medium",
    danger: "text-white font-bold",
  }[variant];

  const textSizeStyles = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
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
      activeOpacity={0.8}
      accessibilityRole="button"
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={variant === "gold" ? "#121214" : "#ffffff"}
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


