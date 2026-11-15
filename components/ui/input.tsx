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
        <Text className="text-xs font-bold text-[#121214] uppercase tracking-wider mb-1.5 ml-1">
          {label}
        </Text>
      ) : null}
      <View
        className={cn(
          "flex-row items-center bg-white border rounded-2xl px-4 py-3.5 shadow-sm",
          error
            ? "border-rose-500"
            : "border-[#EAEAE5] focus:border-[#FFC83B]"
        )}
      >
        {leftElement ? <View className="mr-2.5">{leftElement}</View> : null}
        <TextInput
          placeholderTextColor="#8E8E93"
          style={[{ color: "#121214" }, props.style]}
          className={cn(
            "flex-1 text-base text-[#121214] p-0 font-medium",
            className
          )}
          {...props}
        />
        {rightElement ? <View className="ml-2.5">{rightElement}</View> : null}
      </View>
      {error ? (
        <Text className="text-xs text-rose-500 mt-1 font-medium ml-1">{error}</Text>
      ) : helperText ? (
        <Text className="text-xs text-slate-500 mt-1 ml-1">
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}


