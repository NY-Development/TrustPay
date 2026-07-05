import React from 'react';
import {
  View, Text, TouchableOpacity, TextInput, ScrollView,
  ActivityIndicator, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { useAccounts, useAddAccount, useRemoveAccount, useUpdateAccount } from '@/src/hooks/useAuth';
import { StatusModal } from '@/src/components/StatusModal';

const PROVIDERS = [
  { value: 'cbe', label: 'Commercial Bank (CBE)' },
  { value: 'telebirr', label: 'Telebirr' },
  { value: 'boa', label: 'Bank of Abyssinia' },
  { value: 'dashen', label: 'Dashen Bank' },
  { value: 'awash', label: 'Awash Bank' },
  { value: 'siinqee', label: 'Siinqee Bank (Oromia)' },
  { value: 'mpesa', label: 'M-Pesa (Safaricom)' },
  { value: 'kaafiebirr', label: 'Kaafi eBirr' },
];

export default function ManageAccountsScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themePrimary = isDark ? '#3b82f6' : '#003ec7';

  const { data: accountsResponse, isLoading } = useAccounts();
  const addAccountMutation = useAddAccount();
  const removeAccountMutation = useRemoveAccount();
  const updateAccountMutation = useUpdateAccount();

  const accounts = accountsResponse?.data || [];

  const [showAddForm, setShowAddForm] = React.useState(false);
  const [newNumber, setNewNumber] = React.useState('');
  const [newProvider, setNewProvider] = React.useState('');
  const [showProviderPicker, setShowProviderPicker] = React.useState(false);

  const [deleteTarget, setDeleteTarget] = React.useState<{ accountNumber: string; accountProvider: string } | null>(null);
  const [editTarget, setEditTarget] = React.useState<{ accountNumber: string; accountProvider: string } | null>(null);
  const [isEditing, setIsEditing] = React.useState(false);

  const [modal, setModal] = React.useState({
    visible: false,
    type: 'info' as 'success' | 'error' | 'info',
    title: '',
    message: '',
  });

  const handleAdd = () => {
    if (!newNumber.trim() || !newProvider) return;

    addAccountMutation.mutate(
      { accountNumber: newNumber.trim(), accountProvider: newProvider },
      {
        onSuccess: () => {
          setNewNumber('');
          setNewProvider('');
          setShowAddForm(false);
          setModal({
            visible: true,
            type: 'success',
            title: 'Account Added',
            message: 'Your bank account has been linked.',
          });
        },
        onError: (err: any) => {
          setModal({
            visible: true,
            type: 'error',
            title: 'Failed',
            message: err?.response?.data?.message || 'Could not add account.',
          });
        },
      }
    );
  };

  const handleDelete = () => {
    if (!deleteTarget) return;

    removeAccountMutation.mutate(deleteTarget, {
      onSuccess: () => {
        setDeleteTarget(null);
        setModal({
          visible: true,
          type: 'success',
          title: 'Account Removed',
          message: 'The bank account has been unlinked.',
        });
      },
      onError: (err: any) => {
        setDeleteTarget(null);
        setModal({
          visible: true,
          type: 'error',
          title: 'Failed',
          message: err?.response?.data?.message || 'Could not remove account.',
        });
      },
    });
  };

  const handleUpdate = () => {
    if (!editTarget) return;

    updateAccountMutation.mutate(editTarget, {
      onSuccess: () => {
        setEditTarget(null);
        setModal({
          visible: true,
          type: 'success',
          title: 'Account Updated',
          message: 'The bank account has been updated.',
        });
      },
      onError: (err: any) => {
        setEditTarget(null);
        setModal({
          visible: true,
          type: 'error',
          title: 'Failed',
          message: err?.response?.data?.message || 'Could not update account.',
        });
      },
    });
  };

  const getProviderLabel = (value: string) => {
    return PROVIDERS.find(p => p.value === value)?.label || value;
  };

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="px-6 h-16 flex-row items-center border-b border-border justify-between">
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 rounded-xl bg-muted items-center justify-center border border-border"
            >
              <Ionicons name="arrow-back" size={20} color={isDark ? 'white' : 'black'} />
            </TouchableOpacity>
            <Text className="text-foreground text-xl font-bold ml-4">Manage Accounts</Text>
          </View>

          <TouchableOpacity
            onPress={() => setShowAddForm(!showAddForm)}
            className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center border border-primary/20"
          >
            <Ionicons name={showAddForm ? 'close' : 'add'} size={22} color={themePrimary} />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
            {/* Add Account Form */}
            {showAddForm && (
              <View className="bg-card border border-border rounded-3xl p-5 mb-6">
                <Text className="text-foreground font-bold text-base mb-4">Link New Account</Text>

                {/* Provider Picker */}
                <Text className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-2 ml-1">
                  Provider
                </Text>
                <TouchableOpacity
                  onPress={() => setShowProviderPicker(true)}
                  className="bg-muted border border-border rounded-2xl px-4 h-14 flex-row items-center justify-between mb-4"
                >
                  <View className="flex-row items-center">
                    <Ionicons name="business-outline" size={18} color={isDark ? '#94a3b8' : '#64748b'} />
                    <Text className={`ml-3 text-base ${newProvider ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {newProvider ? getProviderLabel(newProvider) : 'Select provider'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-down" size={18} color={isDark ? '#94a3b8' : '#64748b'} />
                </TouchableOpacity>

                {/* Account Number */}
                <Text className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-2 ml-1">
                  Account Number
                </Text>
                <View className="bg-muted border border-border rounded-2xl px-4 h-14 flex-row items-center mb-5">
                  <Ionicons name="keypad-outline" size={18} color={isDark ? '#94a3b8' : '#64748b'} />
                  <TextInput
                    value={newNumber}
                    onChangeText={setNewNumber}
                    placeholder="e.g. 1000123456789"
                    placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
                    keyboardType="number-pad"
                    className="flex-1 text-foreground text-base ml-3"
                  />
                </View>

                <TouchableOpacity
                  onPress={handleAdd}
                  disabled={!newNumber.trim() || !newProvider || addAccountMutation.isPending}
                  className={`h-12 rounded-2xl items-center justify-center ${
                    newNumber.trim() && newProvider ? 'bg-primary active:opacity-80' : 'bg-muted'
                  }`}
                >
                  {addAccountMutation.isPending ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className={`font-bold text-sm ${newNumber.trim() && newProvider ? 'text-white' : 'text-muted-foreground'}`}>
                      Add Account
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Accounts List */}
            {isLoading ? (
              <View className="items-center py-12">
                <ActivityIndicator color={themePrimary} size="large" />
              </View>
            ) : accounts.length === 0 ? (
              <View className="items-center py-16">
                <View className="bg-muted p-5 rounded-full mb-4">
                  <Ionicons name="wallet-outline" size={40} color={isDark ? '#475569' : '#94a3b8'} />
                </View>
                <Text className="text-foreground font-bold text-lg mb-1">No Accounts</Text>
                <Text className="text-muted-foreground text-sm text-center">
                  Link your bank accounts for faster verification.
                </Text>
              </View>
            ) : (
              <View className="space-y-3 gap-3">
                {accounts.map((acc: any, index: number) => (
                  <TouchableOpacity
                    key={`${acc.accountProvider}-${acc.accountNumber}-${index}`}
                    className="bg-card border border-border rounded-2xl p-4 flex-row items-center justify-between"
                    onPress={() => {
                      setEditTarget(acc);
                      setIsEditing(true);
                    }}
                  >
                    <View className="flex-row items-center flex-1">
                      <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center mr-3">
                        <Ionicons name="card-outline" size={20} color={themePrimary} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-foreground font-bold text-sm">
                          {getProviderLabel(acc.accountProvider)}
                        </Text>
                        <Text className="text-muted-foreground text-xs mt-0.5">
                          •••• {acc.accountNumber.slice(-4)}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => setDeleteTarget(acc)}
                      className="w-9 h-9 rounded-xl bg-destructive/10 items-center justify-center"
                    >
                      <Ionicons name="trash-outline" size={16} color={isDark ? '#ef4444' : '#dc2626'} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Provider Picker Modal */}
      <Modal
        visible={showProviderPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowProviderPicker(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-card border-t border-border rounded-t-3xl p-6 max-h-[70%]">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-foreground text-lg font-bold">Select Provider</Text>
              <TouchableOpacity onPress={() => setShowProviderPicker(false)}>
                <Ionicons name="close" size={24} color={isDark ? 'white' : 'black'} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {PROVIDERS.map((provider) => (
                <TouchableOpacity
                  key={provider.value}
                  onPress={() => {
                    setNewProvider(provider.value);
                    setShowProviderPicker(false);
                  }}
                  className={`h-14 flex-row items-center px-4 rounded-2xl mb-2 ${
                    newProvider === provider.value ? 'bg-primary/10 border border-primary/20' : 'bg-muted/50'
                  }`}
                >
                  <Ionicons
                    name={newProvider === provider.value ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={newProvider === provider.value ? themePrimary : (isDark ? '#475569' : '#94a3b8')}
                  />
                  <Text className={`ml-3 text-base ${newProvider === provider.value ? 'text-foreground font-bold' : 'text-muted-foreground'}`}>
                    {provider.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={!!deleteTarget}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteTarget(null)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-8">
          <View className="bg-card border border-border rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <View className="items-center mb-5">
              <View className="bg-destructive/10 p-4 rounded-full mb-4">
                <Ionicons name="trash-outline" size={28} color={isDark ? '#ef4444' : '#dc2626'} />
              </View>
              <Text className="text-foreground text-lg font-bold text-center">Remove Account?</Text>
              <Text className="text-muted-foreground text-sm text-center mt-2 leading-5">
                This will unlink{' '}
                <Text className="text-foreground font-semibold">
                  {deleteTarget ? getProviderLabel(deleteTarget.accountProvider) : ''}
                </Text>{' '}
                account ending in{' '}
                <Text className="text-foreground font-semibold">
                  {deleteTarget?.accountNumber.slice(-4)}
                </Text>.
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleDelete}
              disabled={removeAccountMutation.isPending}
              className="bg-destructive h-14 rounded-2xl items-center justify-center mb-3 active:opacity-80"
            >
              {removeAccountMutation.isPending ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-base">Yes, Remove</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setDeleteTarget(null)}
              className="bg-muted h-14 rounded-2xl items-center justify-center active:opacity-80"
            >
              <Text className="text-foreground font-bold text-base">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Update Confirmation Modal */}
      <Modal
        visible={!!editTarget}
        transparent
        animationType="fade"
        onRequestClose={() => setEditTarget(null)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-8">
          <View className="bg-card border border-border rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <View className="items-center mb-5">
              <View className="bg-primary/10 p-4 rounded-full mb-4">
                <Ionicons name="create-outline" size={28} color={isDark ? '#3b82f6' : '#003ec7'} />
              </View>
              <Text className="text-foreground text-lg font-bold text-center">Update Account?</Text>
              <Text className="text-muted-foreground text-sm text-center mt-2 leading-5">
                This will update{' '}
                <Text className="text-foreground font-semibold">
                  {editTarget ? getProviderLabel(editTarget.accountProvider) : ''}
                </Text>{' '} 
                account ending in{' '}
                <Text className="text-foreground font-semibold">
                  {editTarget?.accountNumber.slice(-4)}
                </Text>.
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleUpdate}
              disabled={updateAccountMutation.isPending}
              className="bg-primary h-14 rounded-2xl items-center justify-center mb-3 active:opacity-80"
            >
              {updateAccountMutation.isPending ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-base">Yes, Update</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setEditTarget(null)}
              className="bg-muted h-14 rounded-2xl items-center justify-center active:opacity-80"
            >
              <Text className="text-foreground font-bold text-base">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <StatusModal
        {...modal}
        onClose={() => setModal((p) => ({ ...p, visible: false }))}
      />
    </View>
  );
}
