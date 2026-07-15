import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { subscriptionApi } from '@/src/api/subscription.api';
import { useAuthStore } from '@/src/store/authStore';
import { SubscriptionStatusData } from '@/src/types';
import { StatusModal } from '@/src/components/StatusModal';

export default function SubscriptionDetailScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themePrimary = isDark ? '#3b82f6' : '#003ec7';
  
  const user = useAuthStore((s) => s.user);
  const actorType = useAuthStore((s) => s.actorType);

  const [statusData, setStatusData] = React.useState<SubscriptionStatusData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [verifying, setVerifying] = React.useState(false);
  const [reference, setReference] = React.useState('');
  const [selectedPlan, setSelectedPlan] = React.useState<'monthly' | 'yearly'>('monthly');

  const [modal, setModal] = React.useState<{
    visible: boolean;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  }>({ visible: false, type: 'info', title: '', message: '' });

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await subscriptionApi.getStatus();
      if (res.data) {
        setStatusData(res.data);
      }
    } catch (err) {
      console.error('Fetch status failed:', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchStatus();
  }, []);

  const handleVerify = async () => {
    if (!reference.trim()) {
      Alert.alert('Error', 'Please enter a transaction reference.');
      return;
    }

    setVerifying(true);
    try {
      // If it's a partial payment, allow top up. Otherwise standard verification.
      if (statusData?.isPartialPayment) {
        const res = await subscriptionApi.topUpPayment({ reference: reference.trim() });
        setModal({
          visible: true,
          type: 'success',
          title: 'Top Up Success',
          message: res.message || 'Payment top up processed successfully.',
        });
      } else {
        const res = await subscriptionApi.verifyPayment({ reference: reference.trim(), plan: selectedPlan });
        setModal({
          visible: true,
          type: 'success',
          title: 'Subscription Verified',
          message: res.message || 'Subscription processed successfully.',
        });
      }
      setReference('');
      await fetchStatus();
    } catch (err: any) {
      setModal({
        visible: true,
        type: 'error',
        title: 'Verification Failed',
        message: err.response?.data?.message || 'Verification failed. Double check your reference number.',
      });
    } finally {
      setVerifying(false);
    }
  };

  if (actorType !== 'owner') {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center p-6">
        <Ionicons name="lock-closed-outline" size={48} color={isDark ? '#94a3b8' : '#64748b'} />
        <Text className="text-muted-foreground text-lg mt-4 text-center">Only owners can manage branches and billing.</Text>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color={themePrimary} />
      </View>
    );
  }

  const activeSubscription = statusData?.subscription;
  const isTrial = statusData?.subsAccessSource === 'trial';
  const hasAccess = statusData?.isSubsAccessAllowed;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-grow px-6 py-4">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-8">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={isDark ? '#f8fafc' : '#0f172a'} />
          </TouchableOpacity>
          <Text className="text-foreground text-xl font-bold">Billing & Subscription</Text>
          <TouchableOpacity onPress={fetchStatus}>
            <Ionicons name="refresh" size={20} color={isDark ? '#f8fafc' : '#0f172a'} />
          </TouchableOpacity>
        </View>

        {/* Status Dashboard */}
        <View className="bg-card border border-border rounded-3xl p-6 mb-6">
          <Text className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-2">Service Status</Text>
          
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-foreground text-2xl font-bold">
                {hasAccess ? (isTrial ? 'Free Trial' : 'Active Subscription') : 'No Active Plan'}
              </Text>
              {isTrial && (
                <Text className="text-muted-foreground text-sm mt-1">
                  Expires: {statusData?.subsAccessTrialExpiresAt ? new Date(statusData.subsAccessTrialExpiresAt).toLocaleDateString() : 'N/A'}
                </Text>
              )}
              {activeSubscription && (
                <Text className="text-muted-foreground text-sm mt-1">
                  Valid until: {new Date(activeSubscription.endDate).toLocaleDateString()}
                </Text>
              )}
            </View>

            <View className={`w-12 h-12 rounded-full items-center justify-center ${hasAccess ? 'bg-green-500/15' : 'bg-red-500/15'}`}>
              <Ionicons
                name={hasAccess ? 'checkmark-circle-outline' : 'alert-circle-outline'}
                size={28}
                color={hasAccess ? '#10b981' : '#ef4444'}
              />
            </View>
          </View>

          {/* Trial / Duration Tracker */}
          {hasAccess && (
            <View className="bg-muted p-4 rounded-2xl flex-row justify-between items-center mt-2">
              <Text className="text-foreground font-semibold text-sm">Remaining Access Time</Text>
              <Text className="text-primary font-bold text-lg">
                {isTrial ? `${user?.daysLeft ?? 0} days` : 'Unlimited'}
              </Text>
            </View>
          )}

          {statusData?.isPartialPayment && (
            <View className="bg-yellow-500/10 border border-yellow-500/25 p-4 rounded-2xl mt-4">
              <View className="flex-row items-center mb-1">
                <Ionicons name="warning-outline" size={16} color="#d97706" />
                <Text className="text-yellow-600 font-bold text-sm ml-2">Pending Balance</Text>
              </View>
              <Text className="text-yellow-600 text-xs font-semibold leading-relaxed">
                You have a remaining balance of {statusData.remainingAmount} ETB. Please submit another payment transaction code to clear the lock.
              </Text>
            </View>
          )}
        </View>

        {/* Verification Submit Panel */}
        <View className="bg-card border border-border rounded-3xl p-6 mb-10">
          <Text className="text-foreground font-bold text-lg mb-2">Upgrade Plan</Text>
          <Text className="text-muted-foreground text-xs mb-4">
            Select your preferred package, pay via CBA / Telebirr, and submit the reference number below to upgrade.
          </Text>

          {/* Plan Selector */}
          {!statusData?.isPartialPayment && (
            <View className="flex-row mb-6 space-x-2">
              <TouchableOpacity
                onPress={() => setSelectedPlan('monthly')}
                className={`flex-1 h-14 rounded-2xl border items-center justify-center mr-2 ${selectedPlan === 'monthly' ? 'bg-primary border-primary' : 'bg-muted border-border'}`}
              >
                <Text className={`font-bold ${selectedPlan === 'monthly' ? 'text-primary-foreground' : 'text-foreground'}`}>Monthly</Text>
                <Text className={`text-xs ${selectedPlan === 'monthly' ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>250 ETB/mo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setSelectedPlan('yearly')}
                className={`flex-1 h-14 rounded-2xl border items-center justify-center ${selectedPlan === 'yearly' ? 'bg-primary border-primary' : 'bg-muted border-border'}`}
              >
                <Text className={`font-bold ${selectedPlan === 'yearly' ? 'text-primary-foreground' : 'text-foreground'}`}>Yearly (Save 20%)</Text>
                <Text className={`text-xs ${selectedPlan === 'yearly' ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>2400 ETB/yr</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Reference Input */}
          <Text className="text-muted-foreground font-medium mb-2">Transaction Reference ID</Text>
          <View className="bg-muted border border-border rounded-2xl h-14 px-4 flex-row items-center mb-6">
            <Ionicons name="card-outline" size={20} color={isDark ? '#94a3b8' : '#64748b'} />
            <TextInput
              autoCapitalize="characters"
              placeholder="e.g. FT23101..."
              placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
              value={reference}
              onChangeText={setReference}
              className="flex-1 ml-3 text-foreground h-full font-semibold"
            />
          </View>

          <TouchableOpacity
            onPress={handleVerify}
            disabled={verifying}
            className="w-full h-16 bg-primary rounded-2xl items-center justify-center shadow-lg active:opacity-90"
          >
            {verifying ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-primary-foreground font-bold text-lg">
                {statusData?.isPartialPayment ? 'Submit Balance Payment' : 'Activate Plan'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <StatusModal
        visible={modal.visible}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onClose={() => setModal({ ...modal, visible: false })}
      />
    </SafeAreaView>
  );
}
