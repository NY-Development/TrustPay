import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/src/store/authStore';
import { useLogout } from '@/src/hooks/useAuth';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useColorScheme } from 'nativewind';

export default function Settings() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user, biometricsEnabled, setBiometricsEnabled } = useAuthStore();  
  const logoutMutation = useLogout();
  const [notifications, setNotifications] = React.useState(true);

  const handleLogout = () => {
    logoutMutation.mutate(void 0, {
      onSuccess: () => {
        router.replace('/(auth)/login');
      }
    });
  };

  const settingsItems = [
    { section: 'Security', items: [
      { id: 'biometrics', title: 'Biometric Login', icon: 'finger-print', type: 'switch', value: biometricsEnabled, onValueChange: setBiometricsEnabled },
      { id: 'password', title: 'Change Password', icon: 'lock-closed', type: 'chevron' },
    ]},
    { section: 'Notifications', items: [
      { id: 'push', title: 'Push Notifications', icon: 'notifications', type: 'switch', value: notifications, onValueChange: setNotifications },
    ]},
    { section: 'Support & Feedback', items: [
      { id: 'help', title: 'Help Center', icon: 'help-circle', type: 'chevron' },
      { id: 'privacy', title: 'Privacy Policy', icon: 'document-text', type: 'chevron' },
    ]},
  ];

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1">
        <ScrollView className="flex-1 px-6">
          <Text className="text-foreground text-3xl font-bold mb-8 mt-8">Settings</Text>

          {/* Profile Card */}
          <View className="bg-card border border-border rounded-3xl p-6 mb-10 flex-row items-center">
            <View className="w-16 h-16 rounded-2xl bg-primary items-center justify-center">
              <Text className="text-primary-foreground text-2xl font-bold">{user?.name ? user.name[0] : 'U'}</Text>
            </View>
            <View className="ml-5 flex-1">
              <Text className="text-foreground text-xl font-bold">{user?.name}</Text>
              <Text className="text-muted-foreground">{user?.role} • {user?.email}</Text>
            </View>
            <TouchableOpacity className="w-10 h-10 rounded-xl bg-muted items-center justify-center border border-border">
              <Ionicons name="create-outline" size={20} color={isDark ? 'white' : 'black'} />
            </TouchableOpacity>
          </View>

          {/* Sections */}
          {settingsItems.map((section, idx) => (
            <View key={idx} className="mb-10">
              <Text className="text-muted-foreground font-bold text-xs uppercase tracking-widest mb-4 ml-2">{section.section}</Text>
              <View className="bg-card border border-border rounded-3xl overflow-hidden">
                {section.items.map((item, i) => (
                  <TouchableOpacity 
                    key={item.id} 
                    className={`px-6 h-16 flex-row items-center justify-between ${i !== section.items.length - 1 ? 'border-b border-border' : ''}`}
                  >
                    <View className="flex-row items-center">
                      <View className="w-10 h-10 rounded-xl bg-muted items-center justify-center mr-4">
                        <Ionicons name={item.icon as any} size={20} color={isDark ? '#3b82f6' : '#003ec7'} />
                      </View>
                      <Text className="text-foreground text-lg font-medium">{item.title}</Text>
                    </View>
                    
                    {item.type === 'switch' ? (
                      <Switch 
                        value={item.value} 
                        onValueChange={item.onValueChange} 
                        trackColor={{ false: isDark ? '#1e293b' : '#e2e8f0', true: isDark ? '#1e3a8a' : '#003ec7' }}
                        thumbColor={item.value ? (isDark ? '#3b82f6' : '#fff') : '#94a3b8'}
                      />
                    ) : (
                      <Ionicons name="chevron-forward" size={20} color={isDark ? '#1e293b' : '#cbd5e1'} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}

          <TouchableOpacity 
            onPress={handleLogout}
            disabled={logoutMutation.isPending}
            className="bg-destructive/10 border border-destructive/20 h-16 rounded-2xl items-center justify-center flex-row mb-10 active:bg-destructive/20"
          >
            <Ionicons name="log-out-outline" size={24} color={isDark ? '#ef4444' : '#dc2626'} />
            <Text className="text-destructive font-bold text-lg ml-2">Sign Out</Text>
          </TouchableOpacity>

          {/* Version Info */}
          <View className="items-center pb-12 mb-6">
            <Text className="text-muted-foreground text-sm font-medium">
              TrustPay v{Constants.expoConfig?.version ?? '1.0.0'}
            </Text>
            <Text className="text-muted-foreground/60 text-xs mt-1">
              Build: {Platform.select({
                ios: Constants.expoConfig?.ios?.buildNumber ?? '1.0.0',
                android: Constants.expoConfig?.android?.versionCode ?? '1',
                default: 'Web'
              })}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
