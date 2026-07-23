import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useBranchDetail, useBranches } from '@/src/hooks/useBranch';
import { useAuthStore } from '@/src/store/authStore';
import { StatusModal } from '@/src/components/StatusModal';
import { branchApi } from '@/src/api/branch.api';

export default function BranchDetailScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themePrimary = isDark ? '#3b82f6' : '#003ec7';
  
  const { id, readOnly: readOnlyParam } = useLocalSearchParams<{ id: string; readOnly?: string }>();
  const isEditMode = !!id;

  const actorType = useAuthStore((s) => s.actorType);
  // Employees (or explicit readOnly nav) get a view-only branch screen.
  const readOnly = actorType === 'employee' || readOnlyParam === '1';

  const { data: branchData, isLoading: isLoadingDetail, refetch } = useBranchDetail(id || '');
  const { addBranch, modifyBranch, deactivateBranch } = useBranches();
  const loadBranches = useAuthStore((s) => s.loadBranches);

  const branch = branchData?.data as any;

  // Form Fields
  const [branchName, setBranchName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [country, setCountry] = React.useState('Ethiopia');
  const [region, setRegion] = React.useState('');
  const [city, setCity] = React.useState('');
  const [subCity, setSubCity] = React.useState('');
  const [wereda, setWereda] = React.useState('');
  const [kebele, setKebele] = React.useState('');
  const [address, setAddress] = React.useState('');

  // Accounts List Inside Branch
  const [accounts, setAccounts] = React.useState<Array<{ _id?: string; accountNumber: string; accountProvider: string }>>([]);
  const [newAccNum, setNewAccNum] = React.useState('');
  const [newAccProvider, setNewAccProvider] = React.useState('cbe');

  const [saving, setSaving] = React.useState(false);
  const [modal, setModal] = React.useState<{
    visible: boolean;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  }>({ visible: false, type: 'info', title: '', message: '' });

  React.useEffect(() => {
    if (branch) {
      setBranchName(branch.branchName || '');
      setPhone(branch.phone || '');
      setEmail(branch.email || '');
      setCountry(branch.country || 'Ethiopia');
      setRegion(branch.region || '');
      setCity(branch.city || '');
      setSubCity(branch.subCity || '');
      setWereda(branch.wereda || '');
      setKebele(branch.kebele || '');
      setAddress(branch.address || '');
      setAccounts(branch.accounts || []);
    }
  }, [branch]);

  const handleSave = async () => {
    if (!branchName.trim()) {
      Alert.alert('Error', 'Branch Name is required.');
      return;
    }

    setSaving(true);
    try {
      // `accounts` is only accepted by the create-branch endpoint — the
      // update-branch schema doesn't have that field at all (account
      // add/remove goes through dedicated /branches/:id/accounts routes
      // instead), so it must not be included when editing.
      const dataPayload = {
        branchName: branchName.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        country: country.trim() || undefined,
        region: region.trim() || undefined,
        city: city.trim() || undefined,
        subCity: subCity.trim() || undefined,
        wereda: wereda.trim() || undefined,
        kebele: kebele.trim() || undefined,
        address: address.trim() || undefined,
      };

      if (isEditMode) {
        await modifyBranch({ id: id!, data: dataPayload });
        setModal({ visible: true, type: 'success', title: 'Branch Updated', message: 'Branch details saved successfully.' });
      } else {
        await addBranch({ ...dataPayload, accounts });
        setModal({ visible: true, type: 'success', title: 'Branch Created', message: 'New branch created successfully.' });
      }
      await loadBranches();
    } catch (err: any) {
      setModal({ visible: true, type: 'error', title: 'Save Failed', message: err.response?.data?.message || 'Failed to save branch details.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!id) return;
    Alert.alert(
      'Confirm Deactivation',
      'Are you sure you want to deactivate this branch? Legacy transaction links remain but operations will be suspended.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              await deactivateBranch(id);
              setModal({ visible: true, type: 'success', title: 'Deactivated', message: 'Branch has been suspended.' });
              await loadBranches();
            } catch (err: any) {
              setModal({ visible: true, type: 'error', title: 'Failed', message: err.response?.data?.message || 'Deactivation failed.' });
            }
          },
        },
      ]
    );
  };

  // Inline Bank account addition if in edit mode (propagates directly to backend)
  const handleAddAccount = async () => {
    if (!newAccNum.trim()) return;
    if (accounts.some(a => a.accountProvider === newAccProvider)) {
      Alert.alert('Error', `Account for ${newAccProvider.toUpperCase()} already exists.`);
      return;
    }

    try {
      if (isEditMode) {
        await branchApi.addAccount(id!, { accountNumber: newAccNum.trim(), accountProvider: newAccProvider });
        await refetch();
      } else {
        setAccounts([...accounts, { accountNumber: newAccNum.trim(), accountProvider: newAccProvider }]);
      }
      setNewAccNum('');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to add account.');
    }
  };

  const handleRemoveAccount = async (acc: { _id?: string; accountNumber: string; accountProvider: string }) => {
    try {
      if (isEditMode && acc._id) {
        await branchApi.removeAccount(id!, acc._id);
        await refetch();
      } else {
        setAccounts(accounts.filter(a => !(a.accountNumber === acc.accountNumber && a.accountProvider === acc.accountProvider)));
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to remove account.');
    }
  };

  if (isEditMode && isLoadingDetail) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color={themePrimary} />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-grow px-6 py-4">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-8">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={isDark ? '#f8fafc' : '#0f172a'} />
          </TouchableOpacity>
          <Text className="text-foreground text-xl font-bold">
            {!isEditMode ? 'New Branch' : readOnly ? 'Branch Details' : 'Branch Profile'}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <View className="space-y-4">
          <View className="mb-4">
            <Text className="text-muted-foreground font-medium mb-2">Branch Name *</Text>
            <View className="bg-muted border border-border rounded-2xl h-14 px-4 flex-row items-center">
              <Ionicons name="business-outline" size={20} color={isDark ? '#94a3b8' : '#64748b'} />
              <TextInput
                className="flex-1 ml-3 text-foreground"
                placeholder="Branch name (e.g. Bole Medhanialem)"
                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                value={branchName}
                onChangeText={setBranchName}
                editable={!readOnly}
              />
            </View>
          </View>

          {branch?.branchCode && (
            <View className="mb-4 bg-muted/40 p-4 rounded-2xl border border-dashed border-border/80 flex-row justify-between items-center">
              <Text className="text-muted-foreground font-medium">Auto-generated Code</Text>
              <Text className="text-primary font-mono font-bold text-lg">{branch.branchCode}</Text>
            </View>
          )}

          {/* Branch overview: subscription, employees & accounts snapshot */}
          {isEditMode && branch && (
            <View className="mb-4 bg-card border border-border rounded-3xl p-5">
              <Text className="text-foreground font-bold text-base mb-4">Branch Overview</Text>

              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-muted-foreground text-sm">Status</Text>
                <View className={`px-3 py-1 rounded-full ${branch.status === 'ACTIVE' ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
                  <Text className={`text-xs font-bold ${branch.status === 'ACTIVE' ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {branch.status}
                  </Text>
                </View>
              </View>

              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-muted-foreground text-sm">Employees</Text>
                <Text className="text-foreground font-semibold text-sm">{branch.employeeCount ?? 0}</Text>
              </View>

              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-muted-foreground text-sm">Settlement Accounts</Text>
                <Text className="text-foreground font-semibold text-sm">{accounts.length}</Text>
              </View>

              <View className="flex-row justify-between items-center">
                <Text className="text-muted-foreground text-sm">Subscription</Text>
                <Text className={`font-semibold text-sm ${branch.subscription?.status === 'active' ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                  {branch.subscription?.status === 'active'
                    ? 'Active'
                    : (branch.trialDaysLeft ?? 0) > 0
                      ? `Trial • ${branch.trialDaysLeft}d left`
                      : 'Inactive'}
                </Text>
              </View>
            </View>
          )}

          <View className="mb-4">
            <Text className="text-muted-foreground font-medium mb-2">Phone Number</Text>
            <View className="bg-muted border border-border rounded-2xl h-14 px-4 flex-row items-center">
              <Ionicons name="call-outline" size={20} color={isDark ? '#94a3b8' : '#64748b'} />
              <TextInput
                className="flex-1 ml-3 text-foreground"
                placeholder="+251..."
                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                editable={!readOnly}
              />
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-muted-foreground font-medium mb-2">Email (Optional)</Text>
            <View className="bg-muted border border-border rounded-2xl h-14 px-4 flex-row items-center">
              <Ionicons name="mail-outline" size={20} color={isDark ? '#94a3b8' : '#64748b'} />
              <TextInput
                className="flex-1 ml-3 text-foreground"
                placeholder="branch@business.com"
                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                editable={!readOnly}
              />
            </View>
          </View>

          {/* Location fields */}
          <Text className="text-foreground font-bold text-lg mt-4 mb-2">Location details</Text>
          
          <View className="flex-row justify-between mb-4">
            <View className="w-[48%]">
              <Text className="text-muted-foreground text-xs font-semibold mb-1">Region</Text>
              <TextInput
                value={region}
                onChangeText={setRegion}
                placeholder="e.g. Addis Ababa"
                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                editable={!readOnly}
                className="bg-muted border border-border rounded-xl h-12 px-3 text-foreground text-sm"
              />
            </View>
            <View className="w-[48%]">
              <Text className="text-muted-foreground text-xs font-semibold mb-1">City</Text>
              <TextInput
                value={city}
                onChangeText={setCity}
                placeholder="e.g. Addis Ababa"
                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                editable={!readOnly}
                className="bg-muted border border-border rounded-xl h-12 px-3 text-foreground text-sm"
              />
            </View>
          </View>

          <View className="flex-row justify-between mb-4">
            <View className="w-[48%]">
              <Text className="text-muted-foreground text-xs font-semibold mb-1">Sub-City</Text>
              <TextInput
                value={subCity}
                onChangeText={setSubCity}
                placeholder="e.g. Bole"
                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                editable={!readOnly}
                className="bg-muted border border-border rounded-xl h-12 px-3 text-foreground text-sm"
              />
            </View>
            <View className="w-[48%]">
              <Text className="text-muted-foreground text-xs font-semibold mb-1">Wereda</Text>
              <TextInput
                value={wereda}
                onChangeText={setWereda}
                placeholder="e.g. 03"
                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                editable={!readOnly}
                className="bg-muted border border-border rounded-xl h-12 px-3 text-foreground text-sm"
              />
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-muted-foreground font-medium mb-2">Street Address</Text>
            <TextInput
              value={address}
              onChangeText={setAddress}
              placeholder="e.g. Near Edna Mall"
              placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
              editable={!readOnly}
              className="bg-muted border border-border rounded-2xl h-14 px-4 text-foreground text-sm"
            />
          </View>

          {/* Accounts section */}
          <Text className="text-foreground font-bold text-lg mt-6 mb-2">Branch Settlement Accounts</Text>
          <Text className="text-muted-foreground text-xs mb-4">
            Payments processed for this branch are verified against these templates.
          </Text>

          {accounts.map((acc, index) => (
            <View key={index} className="bg-muted border border-border rounded-2xl p-4 flex-row justify-between items-center mb-2">
              <View>
                <Text className="text-foreground font-bold uppercase text-sm mb-1">{acc.accountProvider}</Text>
                <Text className="text-muted-foreground text-base">{acc.accountNumber}</Text>
              </View>
              {!readOnly && (
                <TouchableOpacity onPress={() => handleRemoveAccount(acc)} className="p-2 bg-destructive/10 rounded-xl">
                  <Ionicons name="trash-outline" size={18} color="#ef4444" />
                </TouchableOpacity>
              )}
            </View>
          ))}

          {/* Add account inline */}
          {!readOnly && (
            <View className="bg-card border border-border rounded-3xl p-4 my-2">
              <TextInput
                placeholder="Account Number"
                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                value={newAccNum}
                onChangeText={setNewAccNum}
                keyboardType="number-pad"
                className="bg-muted border border-border rounded-xl h-12 px-3 text-foreground text-sm mb-3"
              />

              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="space-x-2 mb-3 py-1">
                {['cbe', 'telebirr', 'mpesa', 'boa', 'dashen', 'awash'].map((prov) => (
                  <TouchableOpacity
                    key={prov}
                    onPress={() => setNewAccProvider(prov)}
                    className={`px-4 h-10 rounded-full items-center justify-center border mr-2 ${newAccProvider === prov ? 'bg-primary border-primary' : 'bg-muted border-border'}`}
                  >
                    <Text className={`text-xs font-bold ${newAccProvider === prov ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                      {prov.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity
                onPress={handleAddAccount}
                className="bg-primary/20 border border-primary/20 h-10 rounded-xl items-center justify-center"
              >
                <Text className="text-primary font-semibold text-sm">Add Template Account</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Action Buttons */}
          {!readOnly && (
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              className="bg-primary h-16 rounded-2xl items-center justify-center shadow-lg active:opacity-90 mt-8 mb-4"
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-primary-foreground font-bold text-lg">
                  {isEditMode ? 'Save Changes' : 'Create Branch'}
                </Text>
              )}
            </TouchableOpacity>
          )}

          {!readOnly && isEditMode && branch?.status !== 'SUSPENDED' && (
            <TouchableOpacity
              onPress={handleDeactivate}
              className="bg-destructive/10 border border-destructive/25 h-16 rounded-2xl items-center justify-center mb-12"
            >
              <Text className="text-destructive font-bold text-lg">Deactivate Branch</Text>
            </TouchableOpacity>
          )}

          {readOnly && <View className="h-16" />}
        </View>
      </ScrollView>

      <StatusModal
        visible={modal.visible}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onClose={() => {
          setModal({ ...modal, visible: false });
          if (modal.type === 'success') router.back();
        }}
      />
    </SafeAreaView>
  );
}
