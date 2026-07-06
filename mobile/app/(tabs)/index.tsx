import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useColorScheme } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useVerificationHistory } from '@/src/hooks/useVerification';
import { useNotifications } from '@/src/hooks/useNotifications';
import { useAuthStore } from '@/src/store/authStore';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/src/providers/LanguageProvider';
import SubscriptionModal from '@/src/components/SubscriptionModal';

export default function Dashboard() {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user } = useAuthStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');

  useNotifications();
  const { data: infiniteHistory, isLoading, refetch } = useVerificationHistory();
  const router = useRouter();

  useEffect(() => {
    const endDate = user?.trial?.trialEndDate || user?.trialEndDate;
    if (!endDate) return;
    
    const interval = setInterval(() => {
      const end = new Date(endDate).getTime();
      const now = new Date().getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft('Expired');
        clearInterval(interval);
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [user?.trial?.trialEndDate, user?.trialEndDate]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isSameDay = (date: string | Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  };

  const historyItems = infiniteHistory?.pages?.flatMap(page => page.data) || [];
  const todayCount = historyItems.filter((v: any) => isSameDay(v.paymentDate)).length || 0;
  const totalCount = historyItems.length || 0;

  const getLocaleTag = () => {
    if (currentLanguage === 'am') return 'am-ET';
    if (currentLanguage === 'oro') return 'om-ET';
    return 'en-US';
  };

  return (
    <View className="flex-1 bg-background relative">
      <View pointerEvents="none" className="absolute inset-0 flex items-center justify-center overflow-hidden z-0">
        <Text style={{ transform: [{ rotate: '-35deg' }] }} className="text-foreground font-black text-[96px] tracking-widest uppercase opacity-[0.03] dark:opacity-[0.02] text-center select-none">
          Trust Pay
        </Text>
      </View>

      <SafeAreaView className="flex-1 z-10" edges={['top']}>
        <ScrollView
          className="flex-1 px-6"
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={isDark ? '#3b82f6' : '#003ec7'} />
          }
        >
          <View className="flex-row justify-between items-center pt-6 pb-8">
            <View className="flex-row items-center flex-1 pr-4">
              <View className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 items-center justify-center relative">
                <Text className="text-primary font-bold text-lg uppercase">{user?.name ? user.name.slice(0, 2) : 'ME'}</Text>
                <View className="absolute bottom-[-1] right-[-1] w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-background" />
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-muted-foreground text-xs font-bold uppercase tracking-widest">{user?.role || t('common.verified')}</Text>
                <Text className="text-foreground text-2xl font-black tracking-tight truncate">{user?.name || 'TrustPay Hub'}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => router.push('/notification-center')} className="w-12 h-12 bg-card rounded-2xl items-center justify-center border border-border shadow-sm active:opacity-80">
              <Ionicons name="notifications" size={22} color={isDark ? '#3b82f6' : '#003ec7'} />
            </TouchableOpacity>
          </View>

          <View className="flex-row gap-4 mb-8">
            <View className="flex-1 bg-card border border-border rounded-3xl p-5 shadow-sm">
              <Text className="text-muted-foreground font-bold text-xs uppercase mb-1">Plan</Text>
              <Text className="text-foreground font-black text-lg">{user?.trial?.hasUsedTrial ? 'Trial Active' : 'Premium'}</Text>
            </View>
            <TouchableOpacity onPress={() => setModalVisible(true)} className="flex-1 bg-primary rounded-3xl p-5 shadow-sm justify-center">
              <Text className="text-white/80 font-bold text-xs uppercase mb-1">Trial Left</Text>
              <Text className="text-white font-black text-lg">{timeLeft}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => router.push('/(tabs)/verify' as any)}
            activeOpacity={0.9}
            className="bg-primary rounded-[36px] p-6 mb-8 overflow-hidden shadow-2xl shadow-primary/30 min-h-[220px] justify-between"
          >
            <LinearGradient colors={isDark ? ['#1e40af', '#003ec7'] : ['#2563eb', '#003ec7']} className="absolute inset-0" />
            <View className="absolute top-[-30] right-[-30] w-48 h-48 rounded-full bg-white/5" />
            <View className="absolute bottom-[-50] left-[-20] w-36 h-36 rounded-full bg-white/10 opacity-60" />
            <View className="flex-row justify-between items-center mb-6">
              <View className="bg-white/15 p-3 rounded-2xl border border-white/10">
                <Ionicons name="scan-sharp" size={26} color="white" />
              </View>
              <View className="bg-black/20 px-3 py-1.5 rounded-full border border-white/10">
                <Text className="text-white font-black text-[10px] uppercase tracking-widest">{t('dashboard.nodeStatus')}</Text>
              </View>
            </View>
            <View className="mb-6">
              <Text className="text-white text-3xl font-black tracking-tight">{t('dashboard.verifyTitle')}</Text>
              <Text className="text-white/80 text-sm mt-1.5 font-medium leading-5">{t('dashboard.verifyDesc')}</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(tabs)/verify' as any)} className="bg-white rounded-2xl h-14 flex-row items-center justify-center shadow-md active:bg-white/90">
              <Text className="text-primary font-bold text-base mr-2">{t('dashboard.verifyBtn')}</Text>
              <Ionicons name="chevron-forward-circle" size={20} color={isDark ? '#276cff' : '#003ec7'} />
            </TouchableOpacity>
          </TouchableOpacity>

          <View className="flex-row gap-4 mb-8">
            <View className="flex-1 bg-card border border-border rounded-3xl p-5 shadow-sm">
              <View className="flex-row items-center mb-2">
                <Ionicons name="today-outline" size={16} color="#94a3b8" />
                <Text className="text-muted-foreground font-bold text-xs uppercase tracking-wider ml-1.5">{t('dashboard.statToday')}</Text>
              </View>
              <Text className="text-foreground text-3xl font-black tracking-tight">{todayCount}</Text>
            </View>
            <View className="flex-1 bg-card border border-border rounded-3xl p-5 shadow-sm">
              <View className="flex-row items-center mb-2">
                <Ionicons name="pie-chart-outline" size={16} color={isDark ? '#3b82f6' : '#003ec7'} />
                <Text className="text-primary font-bold text-xs uppercase tracking-wider ml-1.5">{t('dashboard.statTotalPool')}</Text>
              </View>
              <Text className="text-foreground text-3xl font-black tracking-tight">{totalCount}</Text>
            </View>
          </View>

          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-5 px-1">
              <Text className="text-foreground text-lg font-black tracking-tight">{t('dashboard.recentActivities')}</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/history')} className="px-3 py-1.5 bg-muted rounded-xl border border-border">
                <Text className="text-primary font-bold text-xs">{t('dashboard.viewAllBtn')}</Text>
              </TouchableOpacity>
            </View>

            {historyItems && historyItems.length > 0 ? (
              historyItems.slice(0, 5).map((item: any, i: number) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => router.push(`/verification/${item._id || item.id}` as any)}
                  className="bg-card border border-border rounded-3xl p-4 mb-3 flex-row items-center active:opacity-90 shadow-sm"
                >
                  <View className="w-12 h-12 bg-muted rounded-xl items-center justify-center border border-border">
                    <Ionicons name="receipt-outline" size={20} color={isDark ? '#3b82f6' : '#003ec7'} />
                  </View>
                  <View className="ml-4 flex-1 pr-2">
                    <Text className="text-foreground font-bold text-base uppercase tracking-tight truncate">{item.transactionId}</Text>
                    <Text className="text-muted-foreground text-xs mt-0.5 font-medium">
                      {item.provider} • {new Date(item.paymentDate).toLocaleDateString(getLocaleTag(), { month: 'short', day: 'numeric' })}
                    </Text>
                  </View>
                  <View className={`px-2.5 py-1 rounded-full border ${item.verified ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
                    <Text className={`font-black text-[10px] tracking-wider ${item.verified ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {item.verified ? t('dashboard.statusSuccess') : t('dashboard.statusPending')}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View className="bg-card border border-border rounded-3xl p-10 items-center justify-center shadow-sm">
                <View className="w-14 h-14 bg-muted rounded-2xl items-center justify-center mb-3 border border-border">
                  <Ionicons name="folder-open-outline" size={24} color="#64748b" />
                </View>
                <Text className="text-muted-foreground text-sm font-semibold">{t('dashboard.emptyLogs')}</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>

      <SubscriptionModal 
        visible={modalVisible} 
        canClose={true} 
        onClose={() => setModalVisible(false)} 
      />
    </View>
  );
}