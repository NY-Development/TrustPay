import React from 'react';
import { View, Text } from 'react-native';
import { usePublicStats } from '@/src/hooks/usePublicStats';

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View className="flex-1 items-center">
      <Text className="text-foreground text-base font-bold">{value}</Text>
      <Text className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider mt-0.5">
        {label}
      </Text>
    </View>
  );
}

export function PublicStatsBar() {
  const { data } = usePublicStats();
  const stats = data?.data;

  const items = [
    { value: stats ? `${stats.companies}+` : '—', label: 'Businesses' },
    { value: stats ? `${stats.branches}+` : '—', label: 'Branches' },
    { value: stats ? `${stats.successRate}%` : '—', label: 'Accuracy' },
  ];

  return (
    <View className="flex-row bg-muted/60 border border-border rounded-2xl py-3 px-2 mb-6">
      {items.map((item, i) => (
        <React.Fragment key={item.label}>
          {i > 0 && <View className="w-px bg-border self-stretch my-1" />}
          <Stat value={item.value} label={item.label} />
        </React.Fragment>
      ))}
    </View>
  );
}
