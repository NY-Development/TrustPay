import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Platform, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/src/store/authStore';
import { useLogout } from '@/src/hooks/useAuth';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useColorScheme } from 'nativewind';
import { useSubscriptionStatus } from '@/src/hooks/useSubscription';
import SubscriptionModal from '@/src/components/SubscriptionModal';
import { useTranslation, Trans } from 'react-i18next'; // 👈 Import Translation
import { useLanguage } from '@/src/providers/LanguageProvider'; // 👈 Import Custom Language Hook

export default function Settings() {
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage } = useLanguage();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user, actorType, biometricsEnabled, setBiometricsEnabled, selectedBranch } = useAuthStore();
  const logoutMutation = useLogout();
  const [notifications, setNotifications] = React.useState(true);
  
  const [isModalVisible, setIsModalVisible] = React.useState(false); 
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);
  const [showLangSelection, setShowLangSelection] = React.useState(false);
  
  const { data: statusResponse, isLoading } = useSubscriptionStatus();
  
  const isSubscriptionActive = statusResponse?.data?.active ?? false;
  const subscriptionDetails = statusResponse?.data?.subscription;

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    logoutMutation.mutate(void 0);
    router.replace('/(auth)/login');
  };

  // Structured Items dynamically fetching Translation tokens at compute layout step
  const settingsItems = [
    ...(actorType === 'owner' ? [{
      section: 'Business Operations',
      items: [
        { id: 'employees', title: 'Manage Employees', icon: 'people-outline', type: 'chevron', route: '/employees' },
        { id: 'communication', title: 'Communications', icon: 'chatbubbles-outline', type: 'chevron', route: '/communications' },
        { id: 'billing', title: 'Billing Options', icon: 'card-outline', type: 'chevron', route: '/subscription-detail' },
      ]
    }] : [{
      section: 'Operations Mode',
      items: [
        { id: 'communication', title: 'Notifications & Messages', icon: 'chatbubbles-outline', type: 'chevron', route: '/communications' },
      ]
    }]),
    { section: t('settings.account'), items: [
      { id: 'accounts', title: t('settings.manageAccounts'), icon: 'wallet-outline', type: 'chevron', route: '/manage-accounts', NoOfAcc: user?.accounts?.length },
    ]},
    { section: t('settings.languageSection'), items: [
      { 
        id: 'language', 
        title: t('settings.languageTitle'), 
        icon: 'globe-outline', 
        type: 'chevron', 
        action: () => setShowLangSelection(true),
        subtext: currentLanguage === 'am' ? t('settings.languageSubTextAmh') : t('settings.languageSubTextEng') 
      },
    ]},
    { section: t('settings.security'), items: [
      { id: 'biometrics', title: t('settings.biometricLogin'), icon: 'finger-print', type: 'switch', value: biometricsEnabled, onValueChange: setBiometricsEnabled },
      { id: 'password', title: t('settings.changePassword'), icon: 'lock-closed', type: 'chevron', route: '/(auth)/forgot-password' },
    ]},
    { section: t('settings.notifications'), items: [
      { id: 'push', title: t('settings.pushNotifications'), icon: 'notifications', type: 'switch', value: notifications, onValueChange: setNotifications },
    ]},
    { section: t('settings.supportFeedback'), items: [
      { id: 'contact', title: t('settings.contactSupport'), icon: 'chatbubbles-outline', type: 'chevron', route: '/contact' },
      { id: 'privacy', title: t('settings.privacyPolicy'), icon: 'document-text-outline', type: 'chevron', route: '/privacy-policy' },
      { id: 'terms', title: t('settings.termsOfUse'), icon: 'document-text-outline', type: 'chevron', route: '/terms-of-use' },
      { id: 'security', title: t('settings.security'), icon: 'document-text-outline', type: 'chevron', route: '/security' },
    ]},
  ];

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString(currentLanguage === 'am' ? 'am-ET' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1">
        <ScrollView className="flex-1 px-6">
          <Text className="text-foreground text-3xl font-bold mb-8 mt-8">{t('settings.title')}</Text>

          {/* Profile Card */}
          <View className="bg-card border border-border rounded-3xl p-6 mb-4">
            <View className="flex-row items-center">
              <View className="w-16 h-16 rounded-2xl bg-primary items-center justify-center">
                <Text className="text-primary-foreground text-2xl font-bold">{user?.name ? user.name[0] : 'U'}</Text>
              </View>
              <View className="ml-5 flex-1">
                <Text className="text-foreground text-xl font-bold">{user?.name}</Text>
                <Text className="text-muted-foreground">{user?.role} • {user?.email}</Text>
              </View>
              <TouchableOpacity 
                onPress={() => router.push('/edit-profile' as any)}
                className="w-10 h-10 rounded-xl bg-muted items-center justify-center border border-border"
              >
                <Ionicons name="create-outline" size={20} color={isDark ? 'white' : 'black'} />
              </TouchableOpacity>
            </View>

            {/* Corporate Profile & Branch Quick Navigation Section */}
            {actorType === 'owner' && (
              <View className="flex-row items-center justify-between border-t border-border mt-5 pt-4 gap-3">
                <TouchableOpacity
                  onPress={() => router.push('/company-profile')}
                  className="flex-1 flex-row items-center justify-center bg-muted h-11 rounded-xl border border-border active:opacity-80"
                >
                  <Ionicons name="business-outline" size={16} color={isDark ? '#3b82f6' : '#003ec7'} />
                  <Text className="text-foreground font-semibold text-sm ml-2">Company</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={() => router.push('/branch-management')}
                  className="flex-1 flex-row items-center justify-center bg-muted h-11 rounded-xl border border-border active:opacity-80"
                >
                  <Ionicons name="git-branch-outline" size={16} color={isDark ? '#3b82f6' : '#003ec7'} />
                  <Text className="text-foreground font-semibold text-sm ml-2">Branches</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Employee: read-only view of their assigned branch */}
            {actorType === 'employee' && selectedBranch && (
              <View className="border-t border-border mt-5 pt-4">
                <TouchableOpacity
                  onPress={() => router.push({ pathname: '/branch-detail', params: { id: selectedBranch._id, readOnly: '1' } } as any)}
                  className="flex-row items-center justify-center bg-muted h-11 rounded-xl border border-border active:opacity-80"
                >
                  <Ionicons name="git-branch-outline" size={16} color={isDark ? '#3b82f6' : '#003ec7'} />
                  <Text className="text-foreground font-semibold text-sm ml-2">My Branch</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Subscription Status Card */}
          {actorType === 'owner' && (
            <View className="bg-card border border-border rounded-3xl p-6 mb-10">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                  <View className="w-8 h-8 rounded-lg bg-primary/10 items-center justify-center mr-3">
                    <Ionicons name="card-outline" size={18} color={isDark ? '#3b82f6' : '#003ec7'} />
                  </View>
                  <Text className="text-foreground text-lg font-bold">{t('settings.subscriptionStatus')}</Text>
                </View>
                
                {isLoading ? (
                  <View className="bg-muted px-3 py-1 rounded-full">
                    <Text className="text-muted-foreground text-xs font-bold uppercase tracking-wider">{t('settings.checking')}</Text>
                  </View>
                ) : isSubscriptionActive ? (
                  <View className="bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    <Text className="text-emerald-500 text-xs font-bold uppercase tracking-wider">{t('settings.active')}</Text>
                  </View>
                ) : (
                  <View className="bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                    <Text className="text-amber-500 text-xs font-bold uppercase tracking-wider">{t('settings.inactive')}</Text>
                  </View>
                )}
              </View>

              {!isLoading && (
                isSubscriptionActive && subscriptionDetails ? (
                  <View>
                    <Text className="text-muted-foreground text-sm">
                      <Trans
                        i18nKey="settings.subActiveText"
                        values={{ plan: subscriptionDetails.plan }}
                        components={{ h1: <Text className="font-bold text-foreground" /> }}
                      />
                    </Text>
                    <Text className="text-muted-foreground text-xs mt-2">
                      {t('settings.subExpiryText')} <Text className="text-foreground font-medium">{formatDate(subscriptionDetails.endDate)}</Text>
                    </Text>
                  </View>
                ) : (
                  <View className="flex-row items-center justify-between mt-1">
                    <Text className="text-muted-foreground text-sm flex-1 mr-4">
                      {t('settings.subUpgradeText')}
                    </Text>
                    <TouchableOpacity 
                      onPress={() => setIsModalVisible(true)} 
                      className="bg-primary px-4 py-2 rounded-xl active:opacity-80"
                    >
                      <Text className="text-primary-foreground font-bold text-sm">{t('settings.upgradeBtn')}</Text>
                    </TouchableOpacity>
                  </View>
                )
              )}
            </View>
          )}

          {/* Render Sections */}
          {settingsItems.map((section, idx) => (
            <View key={idx} className="mb-10">
              <Text className="text-muted-foreground font-bold text-xs uppercase tracking-widest mb-4 ml-2">{section.section}</Text>
              <View className="bg-card border border-border rounded-3xl overflow-hidden">
                {section.items.map((item, i) => (
                  <TouchableOpacity 
                    key={item.id} 
                    onPress={() => {
                      if (item.type !== 'switch') {
                        if ('action' in item && item.action) {
                          item.action();
                        } else if ('route' in item && item.route) {
                          router.push(item.route as any);
                        }
                      }
                    }}
                    disabled={item.type === 'switch'}
                    className={`px-6 h-16 flex-row items-center justify-between ${i !== section.items.length - 1 ? 'border-b border-border' : ''}`}
                  >
                    <View className="flex-row items-center flex-1 pr-4">
                      <View className="w-10 h-10 rounded-xl bg-muted items-center justify-center mr-4">
                        <Ionicons name={item.icon as any} size={20} color={isDark ? '#3b82f6' : '#003ec7'} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-foreground text-lg font-medium">{item.title}</Text>
                        {typeof (item as any).NoOfAcc === 'number' && (
                          <Text className="text-muted-foreground text-xs mt-0.5">
                            {(item as any).NoOfAcc} {(item as any).NoOfAcc === 1 ? t('settings.accountLinked') : t('settings.accountsLinked')}
                          </Text>
                        )}
                        {'subtext' in item && item.subtext && (
                          <Text className="text-primary font-semibold text-xs mt-0.5">{item.subtext}</Text>
                        )}
                      </View>
                    </View>
                    
                    {item.type === 'switch' ? (
                      <Switch 
                        value={(item as any).value} 
                        onValueChange={(item as any).onValueChange} 
                        trackColor={{ false: isDark ? '#1e293b' : '#e2e8f0', true: isDark ? '#1e3a8a' : '#003ec7' }}
                        thumbColor={(item as any).value ? (isDark ? '#3b82f6' : '#fff') : '#94a3b8'}
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
            onPress={() => setShowLogoutConfirm(true)}
            disabled={logoutMutation.isPending}
            className="bg-destructive/10 border border-destructive/20 h-16 rounded-2xl items-center justify-center flex-row mb-10 active:bg-destructive/20"
          >
            <Ionicons name="log-out-outline" size={24} color={isDark ? '#ef4444' : '#dc2626'} />
            <Text className="text-destructive font-bold text-lg ml-2">{t('settings.signOutBtn')}</Text>
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

      {/* Subscription Modal */}
      <SubscriptionModal 
        visible={isModalVisible} 
        canClose={true} 
        onClose={() => setIsModalVisible(false)} 
      />

      {/* Language Selection Modal Sheet */}
      <Modal
        visible={showLangSelection}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLangSelection(false)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-card border-t border-border rounded-t-[36px] p-6 pb-12 w-full shadow-2xl">
            <View className="w-12 h-1 bg-border rounded-full self-center mb-6" />
            
            <Text className="text-foreground text-xl font-black mb-5 px-2">{t('settings.languageTitle')}</Text>

            <TouchableOpacity
              onPress={async () => {
                await changeLanguage('en');
                setShowLangSelection(false);
              }}
              className={`h-16 rounded-2xl px-5 flex-row items-center justify-between mb-3 border ${
                currentLanguage === 'en' ? 'bg-primary/10 border-primary' : 'bg-muted/50 border-transparent'
              }`}
            >
              <Text className={`text-base font-bold ${currentLanguage === 'en' ? 'text-primary' : 'text-foreground'}`}>English</Text>
              {currentLanguage === 'en' && <Ionicons name="checkmark-circle" size={22} color={isDark ? '#3b82f6' : '#003ec7'} />}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={async () => {
                await changeLanguage('am');
                setShowLangSelection(false);
              }}
              className={`h-16 rounded-2xl px-5 flex-row items-center justify-between mb-6 border ${
                currentLanguage === 'am' ? 'bg-primary/10 border-primary' : 'bg-muted/50 border-transparent'
              }`}
            >
              <Text className={`text-base font-bold ${currentLanguage === 'am' ? 'text-primary' : 'text-foreground'}`}>አማርኛ (Amharic)</Text>
              {currentLanguage === 'am' && <Ionicons name="checkmark-circle" size={22} color={isDark ? '#3b82f6' : '#003ec7'} />}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={async () => {
                await changeLanguage('oro');
                setShowLangSelection(false);
              }}
              className={`h-16 rounded-2xl px-5 flex-row items-center justify-between mb-6 border ${
                currentLanguage === 'oro' ? 'bg-primary/10 border-primary' : 'bg-muted/50 border-transparent'
              }`}
            >
              <Text className={`text-base font-bold ${currentLanguage === 'oro' ? 'text-primary' : 'text-foreground'}`}>Oromic (Afaan Oromoo)</Text>
              {currentLanguage === 'oro' && <Ionicons name="checkmark-circle" size={22} color={isDark ? '#3b82f6' : '#003ec7'} />}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowLangSelection(false)}
              className="bg-muted h-14 rounded-2xl items-center justify-center active:opacity-90"
            >
              <Text className="text-foreground font-bold text-base">{t('settings.cancelBtn')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutConfirm(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-8">
          <View className="bg-card border border-border rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <View className="items-center mb-5">
              <View className="bg-destructive/10 p-4 rounded-full mb-4">
                <Ionicons name="log-out-outline" size={32} color={isDark ? '#ef4444' : '#dc2626'} />
              </View>
              <Text className="text-foreground text-xl font-bold text-center">{t('settings.logoutModalTitle')}</Text>
              <Text className="text-muted-foreground text-sm text-center mt-2 leading-5">
                {t('settings.logoutModalDesc')}
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleLogout}
              className="bg-destructive h-14 rounded-2xl items-center justify-center mb-3 active:opacity-80"
            >
              <Text className="text-white font-bold text-base">{t('settings.logoutConfirmBtn')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowLogoutConfirm(false)}
              className="bg-muted h-14 rounded-2xl items-center justify-center active:opacity-80"
            >
              <Text className="text-foreground font-bold text-base">{t('settings.cancelBtn')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}