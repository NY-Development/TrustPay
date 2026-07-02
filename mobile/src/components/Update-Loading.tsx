import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface UpdateLoadingProps {
  progress?: number;
  status?: string;
}

export function UpdateLoading({
  progress = 0,
  status = "Downloading the latest update...",
}: UpdateLoadingProps) {
  const clampedProgress = Math.max(0, Math.min(progress, 100));

  return (
    <View className="flex-1 bg-background items-center justify-center px-8">
      
      {/* Hero Icon */}
      <View className="items-center justify-center">
        <View className="h-24 w-24 rounded-full bg-primary/10 border border-primary/20 items-center justify-center">
          <Ionicons name="shield-checkmark" size={42} color="#2563eb" />
        </View>

        {/* Floating Accent */}
        <View className="absolute -right-2 -top-2 h-9 w-9 rounded-full bg-card border border-border items-center justify-center shadow-sm">
          <Ionicons name="sparkles" size={18} color="#2563eb" />
        </View>
      </View>

      {/* Title */}
      <Text className="mt-8 text-2xl font-bold text-foreground text-center tracking-tight">
        Optimizing Your Experience
      </Text>

      {/* Description */}
      <Text className="mt-3 text-center text-muted-foreground text-base leading-6 max-w-[320px]">
        We're securely applying the latest improvements, performance
        optimizations, and security enhancements.
      </Text>

      {/* Progress Card */}
      <View className="mt-10 w-full max-w-[340px] rounded-3xl border border-border bg-card p-6">
        
        <View className="flex-row justify-between items-center">
          <Text className="text-sm font-semibold text-foreground">
            Installing Updates
          </Text>

          <Text className="text-primary font-bold">
            {Math.round(clampedProgress)}%
          </Text>
        </View>

        {/* Progress Bar */}
        <View className="mt-4 h-2.5 rounded-full bg-muted overflow-hidden">
          <View
            className="h-full rounded-full bg-primary"
            style={{
              width: `${clampedProgress}%`,
            }}
          />
        </View>

        {/* Status */}
        <Text className="mt-4 text-xs text-muted-foreground leading-5">
          {status}
        </Text>
      </View>

      {/* Footer */}
      <Text className="mt-8 text-xs text-muted-foreground text-center">
        Please keep the application open during the update.
      </Text>
    </View>
  );
}