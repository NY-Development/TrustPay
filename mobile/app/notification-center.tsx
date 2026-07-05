import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
// Explicitly target the singular data hook file here
import { useNotifications } from '@/src/hooks/useNotification';

export default function NotificationsCenter() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Connect directly to your singular API data hook
  const { data: notificationsRes, isLoading, clearAll, markAsRead } = useNotifications();
  const notifications = notificationsRes?.data || [];

  /**
   * Helper utility to format MongoDB timestamps on the fly
   */
  const formatTime = (dateStr: string) => {
    try {
      const now = new Date();
      const past = new Date(dateStr);
      const diffMs = now.getTime() - past.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return past.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

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
          
          {notifications.length > 0 && (
            <TouchableOpacity 
              onPress={() => clearAll()}
              className="bg-muted px-3 py-1.5 rounded-xl border border-border active:opacity-70"
            >
              <Text className="text-foreground text-xs font-semibold">Mark All Read</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Loading Spinner State */}
        {isLoading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color={isDark ? '#3b82f6' : '#003ec7'} />
          </View>
        ) : notifications.length === 0 ? (
          /* Empty State */
          <View className="flex-1 items-center justify-center px-6">
            <View className="w-16 h-16 bg-muted rounded-full items-center justify-center mb-4 border border-border">
              <Ionicons name="notifications-off-outline" size={28} color={isDark ? '#64748b' : '#94a3b8'} />
            </View>
            <Text className="text-foreground font-bold text-lg">Inbox Clean</Text>
            <Text className="text-muted-foreground text-sm text-center mt-1">
              You are completely caught up! No recent status matches or alerts found.
            </Text>
          </View>
        ) : (
          /* Active Notification List Feed */
          <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false}>
            {notifications.map((notif: any) => {
              const isSuccess = notif.type === 'success';
              const isWarning = notif.type === 'warning';
              const isError = notif.type === 'error';

              return (
                <TouchableOpacity
                  key={notif._id}
                  onPress={() => {
                    if (!notif.isRead) markAsRead(notif._id);
                  }}
                  activeOpacity={0.8}
                  className={`border rounded-2xl p-4 mb-3 flex-row items-start shadow-xs relative transition-all ${
                    notif.isRead 
                      ? 'bg-card/60 border-border/60 opacity-70' 
                      : 'bg-card border-border'
                  }`}
                >
                  {/* Unread Indicator Dot */}
                  {!notif.isRead && (
                    <View className="absolute top-4 right-4 w-2 h-2 rounded-full bg-primary" />
                  )}

                  {/* Icon Status */}
                  <View className={`p-2 rounded-xl mr-3 ${
                    isSuccess ? 'bg-green-500/10' : isWarning ? 'bg-amber-500/10' : isError ? 'bg-red-500/10' : 'bg-primary/10'
                  }`}>
                    <Ionicons 
                      name={
                        isSuccess 
                          ? 'checkmark-circle' 
                          : isWarning 
                          ? 'alert-circle' 
                          : isError 
                          ? 'close-circle' 
                          : 'notifications'
                      } 
                      size={20} 
                      color={isSuccess ? '#22c55e' : isWarning ? '#f59e0b' : isError ? '#ef4444' : (isDark ? '#3b82f6' : '#003ec7')} 
                    />
                  </View>
                  
                  {/* Content */}
                  <View className="flex-1 pr-4">
                    <View className="flex-row justify-between items-baseline mb-0.5">
                      <Text className={`text-foreground text-sm ${notif.isRead ? 'font-medium' : 'font-bold'}`}>
                        {notif.title}
                      </Text>
                      <Text className="text-muted-foreground text-[10px] ml-2">
                        {formatTime(notif.createdAt)}
                      </Text>
                    </View>
                    <Text className="text-muted-foreground text-xs leading-4 mt-0.5">
                      {notif.body}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}