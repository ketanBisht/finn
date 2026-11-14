import React from "react";
import { View, ViewProps } from "react-native";
import { cn } from "@/lib/utils";

export interface CardProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className, ...props }: CardProps) {
  return (
    <View
      className={cn(
        "bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm",
        className
      )}
      {...props}
    >
      {children}
    </View>
  );
}

