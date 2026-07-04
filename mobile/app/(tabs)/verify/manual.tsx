import React from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useVerifyManual } from '@/src/hooks/useVerification';
import { useVerificationHistory } from '@/src/hooks/useVerification';
import { StatusModal } from '@/src/components/StatusModal';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { useAuthStore } from '@/src/store/authStore';

const providers = [
  { id: 'cbe', name: 'CBE', color: '#8E24AA', placeholder: 'e.g. FT123456789' },
  { id: 'telebirr', name: 'Telebirr', color: '#00E5FF', placeholder: 'e.g. TELE123456789' },
  { id: 'mpesa', name: 'M-Pesa', color: '#4CAF50', placeholder: 'e.g. MP123456789' },
  { id: 'boa', name: 'BOA', color: '#FFD600', placeholder: 'e.g. BOA123456789' },
  { id: 'cbebirr', name: 'CBE Birr', color: '#8E24AA', placeholder: 'e.g. CBE-BIRR123456789' },
  { id: 'dashen', name: 'Dashen', color: '#003ec7', placeholder: 'e.g. DASHEN123456789' },
  { id: 'awash', name: 'Awash', color: '#FF5722', placeholder: 'e.g. AWASH123456789' },
  { id: 'siinqee', name: 'Siinqee', color: '#4CAF50', placeholder: 'e.g. SIINQEE123456789' },
  { id: 'kaafiebirr', name: 'Kaafi', color: '#E91E63', placeholder: 'e.g. KAAFI123456789' },
];

export default function ManualEntry() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user } = useAuthStore();

  const registeredProviders = React.useMemo(() => {
    if (!user?.accounts) return [];
    return providers.filter(p => user.accounts!.some(acc => acc.accountProvider === p.id));
  }, [user]);

  const [provider, setProvider] = React.useState('cbe');
  const [reference, setReference] = React.useState('');
  const [amount, setAmount] = React.useState('');
  const [modal, setModal] = React.useState<{
    visible: boolean;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  }>({ visible: false, type: 'info', title: '', message: '' });

  const verifyMutation = useVerifyManual();
  const { data: history, isLoading, refetch } = useVerificationHistory();

  // history filtered by matching the refrence here and reference on the history fetched okay.
  const filteredHistory = history?.data?.filter(item => 
    item.transactionId.toLowerCase().includes(reference.toLowerCase()) || 
    item.referenceNumber.toLowerCase().includes(reference.toLowerCase())
  );

  React.useEffect(() => {
    if (registeredProviders.length > 0 && !registeredProviders.some(p => p.id === provider)) {
      setProvider(registeredProviders[0].id);
    }
  }, [registeredProviders]);

  const handleVerify = () => {
    if (!reference) {
      setModal({ visible: true, type: 'error', title: 'Missing Info', message: 'Please enter the transaction reference ID.' });
      return;
    }

    verifyMutation.mutate({
      reference,
      amountExpected: amount ? parseFloat(amount) : undefined,
    }, {
      onSuccess: (res) => {
        setModal({
          visible: true,
          type: res.success ? 'success' : 'error',
          title: res.success ? 'Payment Verified' : 'Verification Failed',
          message: res.message || (res.success ? 'Transaction is valid and active.' : 'Invalid reference ID.')
        });
      },
      onError: (err: any) => {
        setModal({
          visible: true,
          type: 'error',
          title: 'Error',
          message: err.response?.data?.message || 'Verification service unreachable.'
        });
      }
    });
  };

  const activeProvider = providers.find(p => p.id === provider) || providers[0];
  const placeholderText = activeProvider ? activeProvider.placeholder : 'e.g. TXN123456789';

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1">
        <ScrollView className="flex-1 px-6">
          <View className="pt-8 flex-row items-center mb-8">
            <TouchableOpacity onPress={() => router.back()} className="w-12 h-12 rounded-full bg-muted items-center justify-center">
              <Ionicons name="chevron-back" size={24} color={isDark ? 'white' : 'black'} />
            </TouchableOpacity>
            <Text className="text-foreground text-2xl font-bold ml-4">Manual Entry</Text>
          </View>
 
          <Text className="text-muted-foreground mb-6">Select provider and enter the reference number from the customer screenshot.</Text>
 
          {registeredProviders.length === 0 ? (
            <View className="bg-warning/10 border border-warning/20 p-6 rounded-3xl mb-8">
              <Text className="text-warning font-bold text-lg mb-2">No Settlement Accounts Registered</Text>
              <Text className="text-muted-foreground text-base">To verify manual payments, please add at least one bank or mobile wallet account in Settings.</Text>
            </View>
          ) : (
            <>
              {/* Provider Selection */}
              <View className="flex-row flex-wrap justify-between mb-8">
                {registeredProviders.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => setProvider(p.id)}
                    className={`w-[48%] h-14 rounded-2xl mb-4 items-center justify-center border-2 ${provider === p.id ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}
                  >
                    <Text className={`font-bold ${provider === p.id ? 'text-primary' : 'text-muted-foreground'}`}>{p.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
 
          {/* Form */}
          <View className="space-y-6 pb-12">
            <View>
              <Text className="text-muted-foreground text-sm font-medium mb-2 ml-1">Reference ID / Transaction ID</Text>
              <View className="bg-muted border border-border rounded-xl px-4 h-14 flex-row items-center">
                <TextInput
                  value={reference}
                  onChangeText={setReference}
                  placeholder={placeholderText}
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  className="flex-1 h-full text-foreground font-bold"
                  autoCapitalize="characters"
                />
              </View>
            </View>
 
            <View>
              <Text className="text-muted-foreground text-sm font-medium mb-2 ml-1">Expected Amount (Optional)</Text>
              <View className="bg-muted border border-border rounded-xl px-4 h-14 flex-row items-center">
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0.00"
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  className="flex-1 h-full text-foreground"
                  keyboardType="numeric"
                />
                <Text className="text-muted-foreground font-bold ml-2">ETB</Text>
              </View>
            </View>
 
            <TouchableOpacity 
              onPress={handleVerify}
              disabled={verifyMutation.isPending || registeredProviders.length === 0}
              className={`bg-primary h-16 rounded-2xl items-center justify-center active:opacity-90 mt-8 mb-16 flex-row ${verifyMutation.isPending || registeredProviders.length === 0 ? 'opacity-50' : ''}`}
            >
              {verifyMutation.isPending ? <ActivityIndicator color={isDark ? '#000' : '#fff'} className="mr-2" /> : <Ionicons name="shield-checkmark" size={24} color={isDark ? '#000' : '#fff'} className="mr-2" />}
              <Text className="text-primary-foreground font-bold text-xl ml-2">Verify Payment</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
 
        <StatusModal 
          visible={modal.visible}
          type={modal.type}
          title={modal.title}
          message={modal.message}
          onClose={() => {
            setModal({ ...modal, visible: false });
            if (modal.type === 'success') router.replace(`/verification/${filteredHistory?.[0]._id || filteredHistory?.[0].id}` as any);
          }} 
        />
      </SafeAreaView>
    </View>
  );
}
