import React from "react";
import { View, Text, TextInput, TextInputProps } from "react-native";
import { cn } from "@/lib/utils";

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  containerClassName?: string;
}

export function Input({
  label,
  error,
  helperText,
  leftElement,
  rightElement,
  containerClassName,
  className,
  ...props
}: InputProps) {
  return (
    <View className={cn("w-full mb-4", containerClassName)}>
      {label ? (
        <Text className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          {label}
        </Text>
      ) : null}
      <View
        className={cn(
          "flex-row items-center bg-slate-50 dark:bg-slate-900 border rounded-2xl px-4 py-3",
          error
            ? "border-rose-500"
            : "border-slate-200 dark:border-slate-800 focus:border-emerald-500"
        )}
      >
        {leftElement ? <View className="mr-2.5">{leftElement}</View> : null}
        <TextInput
          placeholderTextColor="#94a3b8"
          style={[{ color: "#0f172a" }, props.style]}
          className={cn(
            "flex-1 text-base text-slate-900 dark:text-slate-100 p-0",
            className
          )}
          {...props}
        />
        {rightElement ? <View className="ml-2.5">{rightElement}</View> : null}
      </View>
      {error ? (
        <Text className="text-xs text-rose-500 mt-1 font-medium">{error}</Text>
      ) : helperText ? (
        <Text className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}

