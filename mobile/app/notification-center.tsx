import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useNotifications } from '@/src/hooks/useNotifications';

export default function NotificationsCenter() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Connect directly to your existing state hooks
  const { data: notificationsRes, isLoading } = useNotifications();
  const notifications = notificationsRes?.data || [
    { id: '1', title: 'Payment Matched', body: 'Slip Ref #CBE94827 settled smoothly through OCR verification.', type: 'success', time: '10m ago' },
    { id: '2', title: 'Duplicate Warning Flagged', body: 'A slip code was reused. Review actions required within the Dispute hub.', type: 'warning', time: '2h ago' },
  ];

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <View className="px-6 py-4 flex-row justify-between items-center bg-card border-b border-border">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.back()} className="mr-3">
              <Ionicons name="arrow-back" size={24} color={isDark ? 'white' : 'black'} />
            </TouchableOpacity>
            <Text className="text-foreground text-2xl font-bold">Notifications</Text>
          </View>
          <TouchableOpacity className="bg-muted px-3 py-1.5 rounded-xl border border-border">
            <Text className="text-foreground text-xs font-semibold">Clear All</Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false}>
          {notifications.map((notif: any) => {
            const isSuccess = notif.type === 'success';
            const isWarning = notif.type === 'warning';

            return (
              <View key={notif.id} className="bg-card border border-border rounded-2xl p-4 mb-3 flex-row items-start shadow-xs">
                <View className={`p-2 rounded-xl mr-3 ${
                  isSuccess ? 'bg-green-500/10' : isWarning ? 'bg-amber-500/10' : 'bg-primary/10'
                }`}>
                  <Ionicons 
                    name={isSuccess ? 'checkmark-circle' : isWarning ? 'alert-circle' : 'notifications'} 
                    size={20} 
                    color={isSuccess ? '#22c55e' : isWarning ? '#f59e0b' : '#3b82f6'} 
                  />
                </View>
                
                <View className="flex-1 pr-2">
                  <View className="flex-row justify-between items-baseline mb-0.5">
                    <Text className="text-foreground font-bold text-sm">{notif.title}</Text>
                    <Text className="text-muted-foreground text-[10px]">{notif.time}</Text>
                  </View>
                  <Text className="text-muted-foreground text-xs leading-4">{notif.body}</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}