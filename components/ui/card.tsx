import React from "react";
import { View, ViewProps } from "react-native";
import { cn } from "@/lib/utils";

export interface CardProps extends ViewProps {
  children: React.ReactNode;
  variant?: "default" | "gold" | "dark";
  className?: string;
}

export function Card({ children, variant = "default", className, ...props }: CardProps) {
  const variantStyles = {
    default: "bg-white border border-[#EAEAE5]",
    gold: "bg-[#F6CB68] border border-[#E8BC52]",
    dark: "bg-[#121214] border border-[#27272a]",
  }[variant];

  return (
    <View
      className={cn(
        "rounded-[26px] p-5 shadow-sm",
        variantStyles,
        className
      )}
      {...props}
    >
      {children}
    </View>
  );
}


