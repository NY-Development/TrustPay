import React from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useVerifyManual } from '../../../src/hooks/useVerification';
import { StatusModal } from '@/src/components/StatusModal';
import { Ionicons } from '@expo/vector-icons';

const providers = [
  { id: 'telebirr', name: 'Telebirr', color: '#00E5FF' },
  { id: 'cbe', name: 'CBE Birr', color: '#8E24AA' },
  { id: 'abyssinia', name: 'Abyssinia', color: '#FFD600' },
  { id: 'mpesa', name: 'M-Pesa', color: '#4CAF50' },
];

export default function ManualEntry() {
  const [provider, setProvider] = React.useState('telebirr');
  const [reference, setReference] = React.useState('');
  const [accountSuffix, setAccountSuffix] = React.useState('');
  const [suffix, setSuffix] = React.useState('');
  const [amount, setAmount] = React.useState('');
  const [modal, setModal] = React.useState<{
    visible: boolean;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  }>({ visible: false, type: 'info', title: '', message: '' });

  const verifyMutation = useVerifyManual();

  const handleVerify = () => {
    if (!reference) {
      setModal({ visible: true, type: 'error', title: 'Missing Info', message: 'Please enter the transaction reference ID.' });
      return;
    }

    verifyMutation.mutate({
      provider,
      reference,
      accountSuffix: provider === 'cbe' ? accountSuffix : undefined,
      suffix: provider === 'abyssinia' ? suffix : undefined,
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

  return (
    <View className="flex-1 bg-black">
      <SafeAreaView className="flex-1">
        <ScrollView className="flex-1 px-6">
          <View className="pt-8 flex-row items-center mb-8">
            <TouchableOpacity onPress={() => router.back()} className="w-12 h-12 rounded-full bg-white/10 items-center justify-center">
              <Ionicons name="chevron-back" size={24} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-2xl font-bold ml-4">Manual Entry</Text>
          </View>

          <Text className="text-zinc-500 mb-6">Select provider and enter the reference number from the customer screenshot.</Text>

          {/* Provider Selection */}
          <View className="flex-row flex-wrap justify-between mb-8">
            {providers.map((p) => (
              <TouchableOpacity
                key={p.id}
                onPress={() => setProvider(p.id)}
                className={`w-[48%] h-14 rounded-2xl mb-4 items-center justify-center border-2 ${provider === p.id ? 'border-[#00E5FF] bg-[#00E5FF]/10' : 'border-zinc-800 bg-zinc-900'}`}
              >
                <Text className={`font-bold ${provider === p.id ? 'text-[#00E5FF]' : 'text-zinc-500'}`}>{p.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Form */}
          <View className="space-y-6 pb-12">
            <View>
              <Text className="text-zinc-400 text-sm font-medium mb-2 ml-1">Reference ID / Transaction ID</Text>
              <View className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 h-14 flex-row items-center">
                <TextInput
                  value={reference}
                  onChangeText={setReference}
                  placeholder="e.g. TXN123456789"
                  placeholderTextColor="#52525B"
                  className="flex-1 h-full text-white font-bold"
                  autoCapitalize="characters"
                />
              </View>
            </View>

            {provider === 'cbe' && (
              <View>
                <Text className="text-zinc-400 text-sm font-medium mb-2 ml-1">Account Suffix (Last 3-4 digits)</Text>
                <View className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 h-14 flex-row items-center">
                  <TextInput
                    value={accountSuffix}
                    onChangeText={setAccountSuffix}
                    placeholder="e.g. 123"
                    placeholderTextColor="#52525B"
                    className="flex-1 h-full text-white"
                    keyboardType="number-pad"
                  />
                </View>
              </View>
            )}

            {provider === 'abyssinia' && (
              <View>
                <Text className="text-zinc-400 text-sm font-medium mb-2 ml-1">Abyssinia Suffix</Text>
                <View className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 h-14 flex-row items-center">
                  <TextInput
                    value={suffix}
                    onChangeText={setSuffix}
                    placeholder="Suffix from receipt"
                    placeholderTextColor="#52525B"
                    className="flex-1 h-full text-white"
                  />
                </View>
              </View>
            )}

            <View>
              <Text className="text-zinc-400 text-sm font-medium mb-2 ml-1">Expected Amount (Optional)</Text>
              <View className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 h-14 flex-row items-center">
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0.00"
                  placeholderTextColor="#52525B"
                  className="flex-1 h-full text-white"
                  keyboardType="numeric"
                />
                <Text className="text-zinc-500 font-bold ml-2">ETB</Text>
              </View>
            </View>

            <TouchableOpacity 
              onPress={handleVerify}
              disabled={verifyMutation.isPending}
              className={`bg-[#00E5FF] h-16 rounded-2xl items-center justify-center active:opacity-90 mt-8 flex-row ${verifyMutation.isPending ? 'opacity-50' : ''}`}
            >
              {verifyMutation.isPending ? <ActivityIndicator color="black" className="mr-2" /> : <Ionicons name="shield-checkmark" size={24} color="black" className="mr-2" />}
              <Text className="text-black font-bold text-xl ml-2">Verify Payment</Text>
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
            if (modal.type === 'success') router.replace('/(tabs)');
          }} 
        />
      </SafeAreaView>
    </View>
  );
}
