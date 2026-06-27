import React from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useColorScheme } from 'nativewind';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { useVerifySubscription } from '../hooks/useSubscription';
import { StatusModal } from './StatusModal';

interface SubscriptionModalProps {
  visible: boolean;
}

export default function SubscriptionModal({ visible }: SubscriptionModalProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themePrimary = isDark ? '#3b82f6' : '#003ec7';
  
  const logoutUser = useAuthStore(state => state.logout);
  const verifyMutation = useVerifySubscription();

  const [plan, setPlan] = React.useState<'monthly' | 'yearly'>('monthly');
  const [reference, setReference] = React.useState('');
  const [modal, setModal] = React.useState<{
    visible: boolean;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  }>({ visible: false, type: 'info', title: '', message: '' });

  if (!visible) return null;

  const handleVerify = () => {
    if (!reference.trim()) {
      setModal({
        visible: true,
        type: 'error',
        title: 'Reference Missing',
        message: 'Please enter the transaction reference ID shown on your payment confirmation.'
      });
      return;
    }

    verifyMutation.mutate({ reference: reference.trim(), plan }, {
      onSuccess: (res) => {
        setReference('');
        setModal({
          visible: true,
          type: 'success',
          title: 'Subscription Active',
          message: res.message || 'Your subscription payment has been verified! Welcome to TrustPay.'
        });
      },
      onError: (err: any) => {
        setModal({
          visible: true,
          type: 'error',
          title: 'Verification Failed',
          message: err.response?.data?.message || err.message || 'Could not verify payment. Please double-check details.'
        });
      }
    });
  };

  const currentPrice = plan === 'monthly' ? '100' : '1,000';

  return (
    <View className="absolute inset-0 bg-background z-[999] justify-between">
      <SafeAreaSeparator />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        className="flex-1"
      >
        <ScrollView className="flex-1 px-6 pt-12" contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Header logout row */}
          <View className="flex-row justify-between items-center mb-8">
            <View>
              <Text className="text-primary font-bold tracking-widest text-xs uppercase">Paywall Locked</Text>
              <Text className="text-foreground text-3xl font-extrabold mt-1">TrustPay Premium</Text>
            </View>
            <TouchableOpacity 
              onPress={() => logoutUser()}
              className="flex-row items-center bg-muted px-4 py-2.5 rounded-full border border-border"
            >
              <Ionicons name="log-out-outline" size={16} color={isDark ? 'white' : 'black'} />
              <Text className="text-destructive animate-pulse font-bold text-xs ml-1.5">Sign Out</Text>
            </TouchableOpacity>
          </View>

          <Text className="text-muted-foreground text-base leading-6 mb-8">
            TrustPay requires merchants to maintain an active subscription. Select a billing plan, complete your transaction, and register below.
          </Text>

          {/* Plan Selector */}
          <View className="flex-row gap-4 mb-8">
            <TouchableOpacity 
              onPress={() => setPlan('monthly')}
              className={`flex-1 bg-card border-2 p-5 rounded-[24px] ${plan === 'monthly' ? 'border-primary' : 'border-border'}`}
            >
              <Text className="text-muted-foreground font-medium text-xs">MONTHLY PLAN</Text>
              <Text className="text-foreground text-2xl font-black mt-2">100 ETB</Text>
              <Text className="text-muted-foreground text-xs mt-1">Billed monthly</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => setPlan('yearly')}
              className={`flex-1 bg-card border-2 p-5 rounded-[24px] ${plan === 'yearly' ? 'border-primary' : 'border-border'}`}
            >
              <View className="absolute top-2 right-2 bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                <Text className="text-primary text-[9px] font-bold">BEST VALUE</Text>
              </View>
              <Text className="text-muted-foreground font-medium text-xs">YEARLY PLAN</Text>
              <Text className="text-foreground text-2xl font-black mt-2">1,000 ETB</Text>
              <Text className="text-muted-foreground text-xs mt-1">Billed yearly</Text>
            </TouchableOpacity>
          </View>

          {/* Payment Info Card */}
          <View className="bg-card border border-border p-6 rounded-[28px] mb-8 shadow-xs">
            <Text className="text-foreground text-base font-bold mb-4">Payment Instructions</Text>
            <View className="space-y-4">
              <PaymentStep number="1" text={`Transfer exactly ${currentPrice} ETB using any banking app or wallet (CBE, Telebirr, etc.).`} />
              <PaymentStep number="2" text="Send the transaction specifically to receiver: YAMLAK NEGASH DUGO." />
              <PaymentStep number="3" text="Copy the unique transaction reference number/ID from the confirmation screen, and paste it below." />
            </View>
          </View>

          {/* Reference Input */}
          <View className="mb-6">
            <Text className="text-foreground text-sm font-semibold mb-2 pl-1">Transaction Reference (ID)</Text>
            <View className="bg-card border border-border rounded-2xl h-16 px-4 flex-row items-center shadow-xs">
              <Ionicons name="receipt-outline" size={20} color={isDark ? '#64748b' : '#94a3b8'} />
              <TextInput
                value={reference}
                onChangeText={setReference}
                placeholder="e.g. FT23126..."
                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                autoCapitalize="characters"
                className="flex-1 h-full text-foreground ml-3 font-bold uppercase"
              />
            </View>
          </View>

          {/* Action button */}
          <TouchableOpacity 
            onPress={handleVerify}
            disabled={verifyMutation.isPending}
            className="bg-primary h-16 rounded-2xl items-center justify-center flex-row active:opacity-90 shadow-lg shadow-primary/30"
          >
            {verifyMutation.isPending ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="shield-checkmark" size={20} color="white" />
                <Text className="text-white font-bold text-lg ml-2">Verify & Activate</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <StatusModal 
        {...modal} 
        onClose={() => setModal({ ...modal, visible: false })} 
      />
    </View>
  );
}

function PaymentStep({ number, text }: { number: string; text: string }) {
  return (
    <View className="flex-row items-start py-1">
      <View className="w-6 h-6 rounded-full bg-primary/10 items-center justify-center mr-3 mt-0.5">
        <Text className="text-primary font-bold text-xs">{number}</Text>
      </View>
      <Text className="text-muted-foreground text-sm flex-1 leading-5">{text}</Text>
    </View>
  );
}

// Simple top support spacer for ios devices, since SafeAreaView gets empty on absolute layout
function SafeAreaSeparator() {
  if (Platform.OS === 'ios') {
    return <View className="h-10 w-full bg-background" />;
  }
  return null;
}
