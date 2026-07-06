import React from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import { useRegister } from '@/src/hooks/useAuth';
import { StatusModal } from '@/src/components/StatusModal';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { useTranslation } from 'react-i18next'; //

export default function Register() {
  const { t } = useTranslation(); //
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themePrimary = isDark ? '#3b82f6' : '#003ec7';
  
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [accounts, setAccounts] = React.useState<Array<{ accountNumber: string; accountProvider: string }>>([]);
  const [currentAccountNumber, setCurrentAccountNumber] = React.useState('');
  const [currentAccountProvider, setCurrentAccountProvider] = React.useState('cbe');
  const [showPassword, setShowPassword] = React.useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = React.useState(false);
  const [modal, setModal] = React.useState<{
    visible: boolean;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  }>({ visible: false, type: 'info', title: '', message: '' });

  const registerMutation = useRegister();

  const handleAddAccount = () => {
    if (!currentAccountNumber) {
      setModal({ visible: true, type: 'error', title: t('register.errorTitle'), message: t('register.errAccountNum') });
      return;
    }
    if (accounts.some(acc => acc.accountProvider === currentAccountProvider)) {
      setModal({ visible: true, type: 'error', title: t('register.errorTitle'), message: `${t('register.errDuplicate')} ${currentAccountProvider.toUpperCase()}.` });
      return;
    }
    setAccounts([...accounts, { accountNumber: currentAccountNumber, accountProvider: currentAccountProvider }]);
    setCurrentAccountNumber('');
  };

  const handleRemoveAccount = (index: number) => {
    setAccounts(accounts.filter((_, i) => i !== index));
  };

  const handleRegister = async () => {
    if (!name || !email || !password) {
      setModal({ visible: true, type: 'error', title: t('register.errorTitle'), message: 'Please fill name, email and password.' });
      return;
    }
    if (accounts.length === 0) {
      setModal({ visible: true, type: 'error', title: t('register.errorTitle'), message: 'Please add at least one settlement account.' });
      return;
    }

    setConfirmModalVisible(true);
  };

  const executeRegistration = () => {
    setConfirmModalVisible(false);
    registerMutation.mutate({ name: name.trim(), email: email.trim(), password, accounts }, {
      onSuccess: () => {
        setModal({
          visible: true,
          type: 'success',
          title: t('register.errRegisterFailed'),
          message: 'Your account has been created successfully. Welcome to TrustPay!',
        });
      },
      onError: (error: any) => {
        setModal({
          visible: true,
          type: 'error',
          title: t('register.errRegisterFailed'),
          message: error.response?.data?.message || 'Something went wrong. Please try again.'
        });
      }
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView 
          className="flex-1 px-6"
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 40 }}
        >
          <View className="items-center mb-10">
            <View className="w-16 h-16 bg-primary/10 rounded-2xl items-center justify-center mb-6 border border-primary/20">
              <Ionicons name="person-add-outline" size={32} color={isDark ? '#3b82f6' : '#003ec7'} />
            </View>
            <Text className="text-foreground text-3xl font-bold mb-2">{t('register.title')}</Text>
            <Text className="text-muted-foreground text-lg">{t('register.subtitle')}</Text>
          </View>

          <View className="space-y-4">
            <View>
              <Text className="text-muted-foreground text-sm font-medium mb-2 ml-1">{t('register.fullName')}</Text>
              <View className="bg-muted border border-border rounded-2xl h-14 px-4 flex-row items-center focus:border-primary mb-1">
                <Ionicons name="person-outline" size={18} color={isDark ? '#94a3b8' : '#64748b'} />
                <TextInput
                  className="flex-1 ml-3 text-foreground text-lg"
                  placeholder={t('register.namePlaceholder')}
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  value={name}
                  onChangeText={setName}
                />
              </View>
              <Text className="text-xs text-warning ml-1 opacity-80 leading-relaxed">
                {t('register.nameNotice')}
              </Text>
            </View>

            <View>
              <Text className="text-muted-foreground text-sm font-medium mb-2 ml-1 mt-4">{t('register.email')}</Text>
              <View className="bg-muted border border-border rounded-2xl h-14 px-4 flex-row items-center focus:border-primary">
                <Ionicons name="mail-outline" size={18} color={isDark ? '#94a3b8' : '#64748b'} />
                <TextInput
                  className="flex-1 ml-3 text-foreground text-lg"
                  placeholder={t('register.emailPlaceholder')}
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            <View>
              <Text className="text-muted-foreground text-sm font-medium mb-2 ml-1 mt-4">{t('register.password')}</Text>
              <View className="bg-muted border border-border rounded-2xl h-14 px-4 flex-row items-center focus:border-primary">
                <Ionicons name="lock-closed-outline" size={18} color={isDark ? '#94a3b8' : '#64748b'} />
                <TextInput
                  className="flex-1 ml-3 text-foreground text-lg"
                  placeholder={t('register.passPlaceholder')}
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons 
                    name={showPassword ? "eye-off-outline" : "eye-outline"} 
                    size={18} 
                    color={isDark ? '#94a3b8' : '#64748b'} 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {accounts.length > 0 && (
              <View className="mt-4">
                <Text className="text-muted-foreground text-sm font-medium mb-2 ml-1">{t('register.settlementAccounts')}</Text>
                {accounts.map((acc, index) => (
                  <View key={index} className="bg-muted border border-border rounded-2xl p-4 flex-row justify-between items-center mb-2">
                    <View>
                      <Text className="text-foreground font-bold uppercase text-sm mb-1">{acc.accountProvider}</Text>
                      <Text className="text-muted-foreground text-base">{acc.accountNumber}</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleRemoveAccount(index)} className="p-2 bg-destructive/10 rounded-xl">
                      <Ionicons name="trash-outline" size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <View>
              <Text className="text-muted-foreground text-sm font-medium mb-2 ml-1 mt-4">{t('register.addAccountTitle')}</Text>
              <View className="bg-muted border border-border rounded-2xl h-14 px-4 flex-row items-center focus:border-primary">
                <Ionicons name="card-outline" size={18} color={isDark ? '#94a3b8' : '#64748b'} />
                <TextInput
                  className="flex-1 ml-3 text-foreground text-lg"
                  placeholder={t('register.accountPlaceholder')}
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  value={currentAccountNumber}
                  onChangeText={setCurrentAccountNumber}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            <View>
              <Text className="text-muted-foreground text-sm font-medium mb-2 ml-1 mt-4">Account Provider</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                className="space-x-3 py-1"
              >
                {[
                  { id: 'cbe', name: 'CBE' },
                  { id: 'telebirr', name: 'Telebirr' },
                  { id: 'mpesa', name: 'M-Pesa' },
                  { id: 'boa', name: 'BOA' },
                  { id: 'cbebirr', name: 'CBE Birr' },
                  { id: 'dashen', name: 'Dashen' },
                  { id: 'awash', name: 'Awash' },
                  { id: 'siinqee', name: 'Siinqee' },
                  { id: 'kaafiebirr', name: 'Kaafi' },
                ].map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => setCurrentAccountProvider(p.id)}
                    className={`px-5 h-12 rounded-2xl items-center justify-center border ${
                      currentAccountProvider === p.id 
                        ? 'bg-primary border-primary' 
                        : 'bg-muted border-border'
                    } mr-3`}
                  >
                    <Text className={`font-semibold ${
                      currentAccountProvider === p.id ? 'text-primary-foreground' : 'text-muted-foreground'
                    }`}>
                      {p.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <TouchableOpacity 
              onPress={handleAddAccount}
              className="bg-primary/10 border border-primary/20 h-12 rounded-2xl items-center justify-center mt-3"
            >
              <Text className="text-primary font-semibold text-base">{t('register.addBtn')}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handleRegister}
              disabled={registerMutation.isPending}
              className="bg-primary h-16 rounded-2xl items-center justify-center mt-8 active:opacity-90 shadow-lg shadow-primary/20"
            >
              <Text className="text-primary-foreground font-bold text-xl">{t('register.signUpBtn')}</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row justify-center mt-10">
            <Text className="text-muted-foreground text-base">{t('register.alreadyHaveAccount')}</Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text className="text-primary font-bold text-base">{t('register.signIn')}</Text>
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

      {confirmModalVisible && (
        <View className="absolute inset-0 bg-black/60 items-center justify-center z-50 p-6">
          <View className="bg-card w-full max-w-sm rounded-[32px] p-6 border border-border">
            <View className="w-16 h-16 bg-primary/10 rounded-2xl items-center justify-center mb-5 self-center border border-primary/20">
              <Ionicons name="shield-checkmark-outline" size={32} color={themePrimary} />
            </View>
            <Text className="text-foreground text-xl font-bold text-center mb-3">{t('register.confirmTitle')}</Text>
            <Text className="text-muted-foreground text-center text-sm leading-relaxed mb-5">
              {t('register.confirmDesc')}
            </Text>
            <View className="bg-muted p-4 rounded-2xl mb-6">
              <Text className="text-foreground font-extrabold text-center text-lg">{name.trim()}</Text>
            </View>
            <Text className="text-xs text-warning text-center font-medium leading-relaxed mb-6">
              {t('register.confirmWarning')}
            </Text>
            <View className="flex-row justify-between">
              <TouchableOpacity
                onPress={() => setConfirmModalVisible(false)}
                className="w-[47%] h-14 bg-muted rounded-2xl items-center justify-center border border-border active:opacity-90 animate-none"
              >
                <Text className="text-foreground font-bold text-base">{t('register.btnEdit')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={executeRegistration}
                className="w-[47%] h-14 bg-primary rounded-2xl items-center justify-center active:opacity-90 animate-none"
              >
                <Text className="text-white font-bold text-base">{t('register.btnConfirm')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}