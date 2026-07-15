import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import { useRegister } from '@/src/hooks/useAuth';
import { StatusModal } from '@/src/components/StatusModal';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

export default function Register() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Step Tracker
  const [step, setStep] = React.useState(1);

  // Step 1: Credentials
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);

  // Step 2: Company Details
  const [companyName, setCompanyName] = React.useState('');
  const [companyType, setCompanyType] = React.useState('RETAIL');
  const [website, setWebsite] = React.useState('');
  const [companyRegion, setCompanyRegion] = React.useState('');
  const [companyCity, setCompanyCity] = React.useState('');
  const [companyAddress, setCompanyAddress] = React.useState('');

  // Step 3: Initial Branch
  const [branchName, setBranchName] = React.useState('');
  const [branchPhone, setBranchPhone] = React.useState('');
  const [branchEmail, setBranchEmail] = React.useState('');
  const [branchRegion, setBranchRegion] = React.useState('');
  const [branchCity, setBranchCity] = React.useState('');
  const [branchSubCity, setBranchSubCity] = React.useState('');
  const [branchWereda, setBranchWereda] = React.useState('');
  const [branchKebele, setBranchKebele] = React.useState('');
  const [branchAddress, setBranchAddress] = React.useState('');

  // Step 5: Initial Branch Accounts
  const [branchAccounts, setBranchAccounts] = React.useState<Array<{ accountNumber: string; accountProvider: string }>>([]);
  const [accNum, setAccNum] = React.useState('');
  const [accProv, setAccProv] = React.useState('cbe');

  // Modal feedback
  const [errorMsg, setErrorMsg] = React.useState('');
  const [modal, setModal] = React.useState<{
    visible: boolean;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  }>({ visible: false, type: 'info', title: '', message: '' });

  const registerMutation = useRegister();

  const handleNextStep = () => {
    if (step === 1) {
      if (!name || !email || !password) {
        setErrorMsg('Please fill name, email, and password.');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('Password should be at least 6 characters.');
        return;
      }
    } else if (step === 2) {
      if (!companyName || !companyCity || !companyAddress) {
        setErrorMsg('Please fill company name, city, and address.');
        return;
      }
    } else if (step === 3) {
      if (!branchName || !branchPhone || !branchCity || !branchRegion || !branchEmail || !branchAddress) {
        setErrorMsg('Please enter branch name, phone, region, city, email, and address.');
        return;
      }
    } else if (step === 4) {
      if (branchAccounts.length === 0) {
        setErrorMsg('Please add at least one template branch settlement account.');
        return;
      }
    }

    setErrorMsg('');
    setStep(step + 1);
  };

  const handleAddAccount = () => {
    if (!accNum.trim()) return;
    if (branchAccounts.some((a) => a.accountProvider === accProv)) {
      setErrorMsg(`Settlement template for ${accProv.toUpperCase()} already added.`);
      return;
    }
    setBranchAccounts([...branchAccounts, { accountNumber: accNum.trim(), accountProvider: accProv }]);
    setAccNum('');
    setErrorMsg('');
  };

  const handleRemoveAccount = (index: number) => {
    setBranchAccounts(branchAccounts.filter((_, i) => i !== index));
  };

  const handleRegister = () => {
    const payload = {
      name: name.trim(),
      email: email.trim(),
      password,
      companyInfo: {
        companyName: companyName.trim(),
        companyType,
        website: website.trim() || undefined,
        country: 'Ethiopia',
        region: companyRegion.trim(),
        city: companyCity.trim(),
        address: companyAddress.trim(),
      },
      initialBranch: {
        branchName: branchName.trim(),
        country: 'Ethiopia',
        region: branchRegion.trim(),
        city: branchCity.trim(),
        subCity: branchSubCity.trim() || undefined,
        wereda: branchWereda.trim() || undefined,
        kebele: branchKebele.trim() || undefined,
        address: branchAddress.trim(),
        phone: branchPhone.trim(),
        email: branchEmail.trim(),
        accounts: branchAccounts,
      },
    };

    registerMutation.mutate(payload, {
      onSuccess: () => {
        setModal({
          visible: true,
          type: 'success',
          title: 'Welcome to TrustPay',
          message: 'Your Owner profile and initial branch context are set up! Verify access online.',
        });
      },
      onError: (err: any) => {
        setModal({
          visible: true,
          type: 'error',
          title: 'Registration Failed',
          message: err.response?.data?.message || 'Check connection and try again.',
        });
      },
    });
  };

  const companyTypes = [
    { value: 'HOTEL', label: 'Hotel' },
    { value: 'RESTAURANT', label: 'Restaurant' },
    { value: 'FUEL_STATION', label: 'Fuel Station' },
    { value: 'SUPERMARKET', label: 'Supermarket' },
    { value: 'PHARMACY', label: 'Pharmacy' },
    { value: 'RETAIL', label: 'Retail' },
    { value: 'CAFE', label: 'Cafe' },
    { value: 'OTHER', label: 'Other' },
  ];
  const accountProviders = ['cbe', 'telebirr', 'mpesa', 'boa', 'dashen', 'awash'];

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView className="flex-1 px-6 py-4" contentContainerStyle={{ flexGrow: 1 }}>
          
          {/* Top Progress bar Indicator */}
          <View className="flex-row justify-between items-center mb-6 pt-4">
            <TouchableOpacity onPress={() => step > 1 ? setStep(step - 1) : router.back()}>
              <Ionicons name="arrow-back" size={24} color={isDark ? '#f8fafc' : '#0f172a'} />
            </TouchableOpacity>
            <Text className="text-foreground text-sm font-bold">Step {step} of 5</Text>
            <View style={{ width: 24 }} />
          </View>

          <View className="h-1.5 bg-muted rounded-full overflow-hidden mb-8">
            <View
              className="h-full bg-primary"
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </View>

          {errorMsg ? (
            <View className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl mb-6">
              <Text className="text-destructive font-semibold text-sm text-center">{errorMsg}</Text>
            </View>
          ) : null}

          {/* Wizard step renderers */}
          {step === 1 && (
            <View className="flex-grow space-y-4">
              <Text className="text-foreground text-2xl font-bold mb-1">Create Owner Profile</Text>
              <Text className="text-muted-foreground text-sm mb-6">Enter your personal registration credentials.</Text>

              <View className="mb-4">
                <Text className="text-muted-foreground text-xs font-semibold mb-2">Full Name</Text>
                <View className="bg-muted border border-border rounded-2xl h-14 px-4 flex-row items-center">
                  <Ionicons name="person-outline" size={20} color={isDark ? '#94a3b8' : '#64748b'} />
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="e.g. Samuel Ayele"
                    placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                    className="flex-1 ml-3 text-foreground"
                  />
                </View>
              </View>

              <View className="mb-4">
                <Text className="text-muted-foreground text-xs font-semibold mb-2">Primary Email</Text>
                <View className="bg-muted border border-border rounded-2xl h-14 px-4 flex-row items-center">
                  <Ionicons name="mail-outline" size={20} color={isDark ? '#94a3b8' : '#64748b'} />
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="email@merchant.com"
                    placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    className="flex-1 ml-3 text-foreground"
                  />
                </View>
              </View>

              <View className="mb-4">
                <Text className="text-muted-foreground text-xs font-semibold mb-2">Login Password</Text>
                <View className="bg-muted border border-border rounded-2xl h-14 px-4 flex-row items-center">
                  <Ionicons name="lock-closed-outline" size={20} color={isDark ? '#94a3b8' : '#64748b'} />
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Min 6 characters"
                    placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                    secureTextEntry={!showPassword}
                    className="flex-1 ml-3 text-foreground"
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={isDark ? '#94a3b8' : '#64748b'} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {step === 2 && (
            <View className="flex-grow space-y-4">
              <Text className="text-foreground text-2xl font-bold mb-1">Company Details</Text>
              <Text className="text-muted-foreground text-sm mb-6">Enter your organization details.</Text>

              <View className="mb-4">
                <Text className="text-muted-foreground text-xs font-semibold mb-2">Company Name</Text>
                <View className="bg-muted border border-border rounded-2xl h-14 px-4 flex-row items-center">
                  <Ionicons name="business-outline" size={20} color={isDark ? '#94a3b8' : '#64748b'} />
                  <TextInput
                    value={companyName}
                    onChangeText={setCompanyName}
                    placeholder="e.g. Samuel Foods PLC"
                    placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                    className="flex-1 ml-3 text-foreground"
                  />
                </View>
              </View>

              {/* Company Type selection */}
              <View className="mb-4">
                <Text className="text-muted-foreground text-xs font-semibold mb-2">Operating Field</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-1">
                  {companyTypes.map((ct) => (
                    <TouchableOpacity
                      key={ct.value}
                      onPress={() => setCompanyType(ct.value)}
                      className={`px-4 h-11 rounded-2xl items-center justify-center border mr-2 ${companyType === ct.value ? 'bg-primary border-primary' : 'bg-muted border-border'}`}
                    >
                      <Text className={`text-xs font-bold ${companyType === ct.value ? 'text-primary-foreground' : 'text-muted-foreground'}`}>{ct.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Location */}
              <View className="flex-row justify-between mb-4">
                <View className="w-[48%]">
                  <Text className="text-muted-foreground text-xs font-semibold mb-1">Region</Text>
                  <TextInput
                    value={companyRegion}
                    onChangeText={setCompanyRegion}
                    placeholder="e.g. Addis Ababa"
                    placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                    className="bg-muted border border-border rounded-xl h-12 px-3 text-foreground text-sm"
                  />
                </View>
                <View className="w-[48%]">
                  <Text className="text-muted-foreground text-xs font-semibold mb-1">City</Text>
                  <TextInput
                    value={companyCity}
                    onChangeText={setCompanyCity}
                    placeholder="e.g. Addis Ababa"
                    placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                    className="bg-muted border border-border rounded-xl h-12 px-3 text-foreground text-sm"
                  />
                </View>
              </View>

              <View className="mb-4">
                <Text className="text-muted-foreground text-xs font-semibold mb-2">Headquarters Address</Text>
                <TextInput
                  value={companyAddress}
                  onChangeText={setCompanyAddress}
                  placeholder="e.g. Bole Sub-city, Wereda 08"
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  className="bg-muted border border-border rounded-2xl h-14 px-4 text-foreground text-sm"
                />
              </View>
            </View>
          )}

          {step === 3 && (
            <View className="flex-grow space-y-4">
              <Text className="text-foreground text-2xl font-bold mb-1">Initial Branch Context</Text>
              <Text className="text-muted-foreground text-sm mb-6">Set up your business's first active storefront.</Text>

              <View className="mb-4">
                <Text className="text-muted-foreground text-xs font-semibold mb-2">Branch Name</Text>
                <TextInput
                  value={branchName}
                  onChangeText={setBranchName}
                  placeholder="e.g. Bole Medhanialem Store"
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  className="bg-muted border border-border rounded-2xl h-14 px-4 text-foreground text-sm"
                />
              </View>

              <View className="mb-4">
                <Text className="text-muted-foreground text-xs font-semibold mb-2">Branch Contact Phone</Text>
                <TextInput
                  value={branchPhone}
                  onChangeText={setBranchPhone}
                  placeholder="+251..."
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  keyboardType="phone-pad"
                  className="bg-muted border border-border rounded-2xl h-14 px-4 text-foreground text-sm"
                />
              </View>

              <View className="flex-row justify-between mb-4">
                <View className="w-[48%]">
                  <Text className="text-muted-foreground text-xs font-semibold mb-1">Region</Text>
                  <TextInput
                    value={branchRegion}
                    onChangeText={setBranchRegion}
                    placeholder="Addis Ababa"
                    placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                    className="bg-muted border border-border rounded-xl h-12 px-3 text-foreground text-xs"
                  />
                </View>
                <View className="w-[48%]">
                  <Text className="text-muted-foreground text-xs font-semibold mb-1">City</Text>
                  <TextInput
                    value={branchCity}
                    onChangeText={setBranchCity}
                    placeholder="Addis Ababa"
                    placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                    className="bg-muted border border-border rounded-xl h-12 px-3 text-foreground text-xs"
                  />
                </View>
              </View>

              <View className="flex-row justify-between mb-4">
                <View className="w-[48%]">
                  <Text className="text-muted-foreground text-xs font-semibold mb-1">Sub-City</Text>
                  <TextInput
                    value={branchSubCity}
                    onChangeText={setBranchSubCity}
                    placeholder="Bole"
                    placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                    className="bg-muted border border-border rounded-xl h-12 px-3 text-foreground text-xs"
                  />
                </View>
                <View className="w-[48%]">
                  <Text className="text-muted-foreground text-xs font-semibold mb-1">Wereda</Text>
                  <TextInput
                    value={branchWereda}
                    onChangeText={setBranchWereda}
                    placeholder="03"
                    placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                    className="bg-muted border border-border rounded-xl h-12 px-3 text-foreground text-xs"
                  />
                </View>
              </View>

              <View className="flex-row justify-between mb-4">
                <View className="w-[48%]">
                  <Text className="text-muted-foreground text-xs font-semibold mb-1">Kebele</Text>
                  <TextInput
                    value={branchKebele}
                    onChangeText={setBranchKebele}
                    placeholder="12"
                    placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                    className="bg-muted border border-border rounded-xl h-12 px-3 text-foreground text-xs"
                  />
                </View>
                <View className="w-[48%]">
                  <Text className="text-muted-foreground text-xs font-semibold mb-1">Branch Email *</Text>
                  <TextInput
                    value={branchEmail}
                    onChangeText={setBranchEmail}
                    placeholder="branch@merchant.com"
                    placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    className="bg-muted border border-border rounded-xl h-12 px-3 text-foreground text-xs"
                  />
                </View>
              </View>

              <View className="mb-4">
                <Text className="text-muted-foreground text-xs font-semibold mb-2">Branch Address *</Text>
                <TextInput
                  value={branchAddress}
                  onChangeText={setBranchAddress}
                  placeholder="e.g. Bole Medhanialem, near Edna Mall"
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  className="bg-muted border border-border rounded-2xl h-14 px-4 text-foreground text-sm"
                />
              </View>
            </View>
          )}

          {step === 4 && (
            <View className="flex-grow space-y-4">
              <Text className="text-foreground text-2xl font-bold mb-1">Settlement Templates</Text>
              <Text className="text-muted-foreground text-sm mb-6">Link incoming templates for verification triggers.</Text>

              {branchAccounts.map((acc, index) => (
                <View key={index} className="bg-muted border border-border rounded-2xl p-4 flex-row justify-between items-center mb-2">
                  <View>
                    <Text className="text-foreground font-bold uppercase text-xs mb-1">{acc.accountProvider}</Text>
                    <Text className="text-muted-foreground text-sm">{acc.accountNumber}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleRemoveAccount(index)} className="p-2 bg-destructive/10 rounded-xl">
                    <Ionicons name="trash-outline" size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}

              <TextInput
                placeholder="Enter Settlement Account Number"
                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                value={accNum}
                onChangeText={setAccNum}
                keyboardType="number-pad"
                className="bg-muted border border-border rounded-2xl h-14 px-4 text-foreground text-sm mb-2"
              />

              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-1">
                {accountProviders.map((p) => (
                  <TouchableOpacity
                    key={p}
                    onPress={() => setAccProv(p)}
                    className={`px-4 h-10 rounded-full items-center justify-center border mr-2 ${accProv === p ? 'bg-primary border-primary' : 'bg-muted border-border'}`}
                  >
                    <Text className={`text-xs font-bold ${accProv === p ? 'text-primary-foreground' : 'text-muted-foreground'}`}>{p.toUpperCase()}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity
                onPress={handleAddAccount}
                className="bg-primary/20 border border-primary/20 h-12 rounded-xl items-center justify-center mt-2"
              >
                <Text className="text-primary font-bold">Add Account Template</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 5 && (
            <View className="flex-grow space-y-4">
              <Text className="text-foreground text-2xl font-bold mb-1">Confirm Registration</Text>
              <Text className="text-muted-foreground text-sm mb-6">Verify details before submitting to the ledger.</Text>

              <View className="bg-card border border-border rounded-3xl p-5 mb-4 space-y-3">
                <Text className="text-foreground font-bold text-base mb-1">Profile Info</Text>
                <Text className="text-muted-foreground text-sm">Owner Name: <Text className="text-foreground font-semibold">{name}</Text></Text>
                <Text className="text-muted-foreground text-sm">Email Address: <Text className="text-foreground font-semibold">{email}</Text></Text>

                <Text className="text-foreground font-bold text-base mt-4 mb-1">Organization Details</Text>
                <Text className="text-muted-foreground text-sm">Company Name: <Text className="text-foreground font-semibold">{companyName}</Text></Text>
                <Text className="text-muted-foreground text-sm">Type: <Text className="text-foreground font-semibold">{companyType}</Text></Text>

                <Text className="text-foreground font-bold text-base mt-4 mb-1">Branch Setup</Text>
                <Text className="text-muted-foreground text-sm">Initial Name: <Text className="text-foreground font-semibold">{branchName}</Text></Text>
                <Text className="text-muted-foreground text-sm">Contacts: <Text className="text-foreground font-semibold">{branchPhone}</Text></Text>
                <Text className="text-muted-foreground text-sm">Linked templates count: <Text className="text-primary font-bold">{branchAccounts.length}</Text></Text>
              </View>
            </View>
          )}

          {/* Action Row */}
          <View className="mt-8 mb-6">
            <TouchableOpacity
              onPress={step === 5 ? handleRegister : handleNextStep}
              disabled={registerMutation.isPending}
              className="bg-primary h-16 rounded-2xl items-center justify-center shadow-lg active:opacity-95"
            >
              {registerMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-primary-foreground font-bold text-lg">
                  {step === 5 ? 'Register Credentials' : 'Next Step'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
          
          <View className="flex-row justify-center mb-6">
            <Text className="text-muted-foreground">Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text className="text-primary font-bold">Sign In</Text>
              </TouchableOpacity>
            </Link>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

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
  );
}