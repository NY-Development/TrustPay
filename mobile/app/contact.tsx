import React from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { useSubmitContact } from '@/src/hooks/useContact';
import { StatusModal } from '@/src/components/StatusModal';
import { useTranslation } from 'react-i18next'; // 👈 Import Translation Hook

export default function ContactScreen() {
  const { t } = useTranslation(); // 👈 Initialize Translation
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Accept optional category/subject from route query params
  const params = useLocalSearchParams<{ category?: string; subject?: string }>();

  const [category, setCategory] = React.useState<'refund' | 'support' | 'feedback' | 'other'>(
    (params.category as any) || 'support'
  );
  const [subject, setSubject] = React.useState(params.subject || '');
  const [message, setMessage] = React.useState('');
  
  const submitContactMutation = useSubmitContact();
  const [modal, setModal] = React.useState<{
    visible: boolean;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  }>({ visible: false, type: 'info', title: '', message: '' });

  const categories = [
    { id: 'refund', label: t('contact.catRefund'), icon: 'cash-outline' },
    { id: 'support', label: t('contact.catSupport'), icon: 'help-circle-outline' },
    { id: 'feedback', label: t('contact.catFeedback'), icon: 'chatbox-ellipses-outline' },
    { id: 'other', label: t('contact.catOther'), icon: 'ellipsis-horizontal-circle-outline' },
  ] as const;

  const handleSubmit = () => {
    if (!subject.trim()) {
      setModal({
        visible: true,
        type: 'error',
        title: t('contact.errSubjectTitle'),
        message: t('contact.errSubjectDesc'),
      });
      return;
    }

    if (!message.trim()) {
      setModal({
        visible: true,
        type: 'error',
        title: t('contact.errMessageTitle'),
        message: t('contact.errMessageDesc'),
      });
      return;
    }

    submitContactMutation.mutate(
      {
        category,
        subject: subject.trim(),
        message: message.trim(),
      },
      {
        onSuccess: (res) => {
          setSubject('');
          setMessage('');
          setModal({
            visible: true,
            type: 'success',
            title: t('contact.successTitle'),
            message: res.message || t('contact.successDesc'),
          });
        },
        onError: (err: any) => {
          setModal({
            visible: true,
            type: 'error',
            title: t('contact.failedTitle'),
            message: err.response?.data?.message || err.message || t('contact.failedDesc'),
          });
        },
      }
    );
  };

  const handleCloseSuccess = () => {
    setModal({ ...modal, visible: false });
    if (modal.type === 'success') {
      router.back();
    }
  };

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          className="flex-1"
        >
          {/* Header */}
          <View className="px-6 h-16 flex-row items-center border-b border-border">
            <TouchableOpacity 
              onPress={() => router.back()}
              className="w-10 h-10 rounded-xl bg-muted items-center justify-center border border-border"
            >
              <Ionicons name="arrow-back" size={20} color={isDark ? 'white' : 'black'} />
            </TouchableOpacity>
            <Text className="text-foreground text-xl font-bold ml-4">{t('contact.title')}</Text>
          </View>

          <ScrollView className="flex-1 px-6 pt-6" contentContainerStyle={{ paddingBottom: 40 }}>
            <Text className="text-muted-foreground text-sm mb-6 leading-5">
              {t('contact.subtitle')}
            </Text>

            {/* Select Category */}
            <Text className="text-foreground text-sm font-semibold mb-3">{t('contact.lblCategory')}</Text>
            <View className="flex-row flex-wrap gap-2 mb-6">
              {categories.map((cat) => {
                const isSelected = category === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setCategory(cat.id)}
                    className={`flex-row items-center px-4 py-3 rounded-2xl border ${
                      isSelected 
                        ? 'bg-primary/10 border-primary' 
                        : 'bg-card border-border'
                    }`}
                  >
                    <Ionicons 
                      name={cat.icon as any} 
                      size={18} 
                      color={isSelected ? (isDark ? '#3b82f6' : '#003ec7') : (isDark ? '#94a3b8' : '#64748b')} 
                    />
                    <Text 
                      className={`ml-2 text-sm font-semibold ${
                        isSelected 
                          ? 'text-primary' 
                          : 'text-muted-foreground'
                      }`}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Subject Input */}
            <View className="mb-5">
              <Text className="text-foreground text-sm font-semibold mb-2 pl-1">{t('contact.lblSubject')}</Text>
              <View className="bg-card border border-border rounded-2xl h-14 px-4 flex-row items-center shadow-xs">
                <Ionicons name="bookmark-outline" size={18} color={isDark ? '#64748b' : '#94a3b8'} />
                <TextInput
                  value={subject}
                  onChangeText={setSubject}
                  placeholder={t('contact.placeholderSubject')}
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  className="flex-1 h-full text-foreground ml-3 text-sm"
                />
              </View>
            </View>

            {/* Message Input */}
            <View className="mb-8">
              <Text className="text-foreground text-sm font-semibold mb-2 pl-1">{t('contact.lblMessage')}</Text>
              <View className="bg-card border border-border rounded-2xl p-4 shadow-xs min-h-[160px]">
                <TextInput
                  value={message}
                  onChangeText={setMessage}
                  placeholder={t('contact.placeholderMessage')}
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                  className="w-full text-foreground text-sm leading-5"
                />
              </View>
            </View>

            {/* Action button */}
            <TouchableOpacity 
              onPress={handleSubmit}
              disabled={submitContactMutation.isPending}
              className="bg-primary h-16 rounded-2xl items-center justify-center flex-row active:opacity-90 shadow-lg shadow-primary/30"
            >
              {submitContactMutation.isPending ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="paper-plane" size={20} color="white" />
                  <Text className="text-white font-bold text-lg ml-2">{t('contact.btnSubmit')}</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <StatusModal 
        {...modal} 
        onClose={handleCloseSuccess} 
      />
    </View>
  );
}