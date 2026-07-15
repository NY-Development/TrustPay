import React from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMessages, useSendMessage, useMarkMessageRead } from '@/src/hooks/useCommunication';
import { useBranches } from '@/src/hooks/useBranch';
import { useEmployees } from '@/src/hooks/useEmployee';
import { useAuthStore } from '@/src/store/authStore';
import { Message } from '@/src/types';

export default function CommunicationsScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const user = useAuthStore((s) => s.user);
  const actorType = useAuthStore((s) => s.actorType);

  const { data: messagesData, isLoading, refetch } = useMessages();
  const sendMutation = useSendMessage();
  const markReadMutation = useMarkMessageRead();

  const [showCompose, setShowCompose] = React.useState(false);
  const [composeForm, setComposeForm] = React.useState({
    recipientType: 'COMPANY' as 'INDIVIDUAL' | 'BRANCH' | 'COMPANY',
    messageType: 'ANNOUNCEMENT' as 'ANNOUNCEMENT' | 'TASK' | 'REMINDER' | 'ALERT',
    title: '',
    body: '',
    branchId: '',
  });

  const messages = messagesData?.data ?? [];

  const handleSend = async () => {
    if (!composeForm.title || !composeForm.body) return;
    try {
      await sendMutation.mutateAsync({
        recipientType: composeForm.recipientType,
        messageType: composeForm.messageType,
        title: composeForm.title,
        body: composeForm.body,
        branchId: composeForm.recipientType === 'BRANCH' ? composeForm.branchId : undefined,
      });
      setShowCompose(false);
      setComposeForm({ recipientType: 'COMPANY', messageType: 'ANNOUNCEMENT', title: '', body: '', branchId: '' });
    } catch (err) {
      console.error('Send failed', err);
    }
  };

  const typeIcons: Record<string, string> = {
    ANNOUNCEMENT: 'megaphone-outline',
    TASK: 'checkbox-outline',
    REMINDER: 'alarm-outline',
    ALERT: 'warning-outline',
  };

  const renderItem = ({ item }: { item: Message }) => {
    const isRead = item.readBy?.includes(user?._id || '');
    return (
      <TouchableOpacity
        onPress={async () => {
          if (!isRead) await markReadMutation.mutateAsync(item._id);
        }}
        className={`bg-card border rounded-2xl p-4 mb-3 ${isRead ? 'border-border' : 'border-primary/40'}`}
      >
        <View className="flex-row items-start">
          <View className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${isRead ? 'bg-muted' : 'bg-primary/10'}`}>
            <Ionicons name={(typeIcons[item.messageType] || 'chatbox-outline') as any} size={20} color={isDark ? '#3b82f6' : '#003ec7'} />
          </View>
          <View className="flex-1">
            <View className="flex-row justify-between items-center mb-1">
              <Text className={`font-bold text-base ${isRead ? 'text-foreground' : 'text-primary'}`}>{item.title}</Text>
              {!isRead && <View className="w-2 h-2 rounded-full bg-primary" />}
            </View>
            <Text className="text-muted-foreground text-sm" numberOfLines={2}>{item.body}</Text>
            <View className="flex-row items-center mt-2 space-x-3">
              <Text className="text-muted-foreground text-xs">{new Date(item.createdAt).toLocaleDateString()}</Text>
              <View className="bg-muted px-2 py-0.5 rounded-full ml-2">
                <Text className="text-muted-foreground text-xs">{item.recipientType}</Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-6 pt-4 pb-2">
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={isDark ? '#f8fafc' : '#0f172a'} />
          </TouchableOpacity>
          <Text className="text-foreground text-xl font-bold">Communications</Text>
          {actorType === 'owner' && (
            <TouchableOpacity onPress={() => setShowCompose(true)}>
              <Ionicons name="create-outline" size={24} color={isDark ? '#3b82f6' : '#003ec7'} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={isDark ? '#3b82f6' : '#003ec7'} />
        </View>
      ) : (
        <FlatList
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 20 }}
          ListEmptyComponent={
            <View className="items-center justify-center py-12">
              <Ionicons name="chatbubbles-outline" size={48} color={isDark ? '#334155' : '#cbd5e1'} />
              <Text className="text-muted-foreground mt-4">No messages yet</Text>
            </View>
          }
          refreshing={isLoading}
          onRefresh={refetch}
        />
      )}

      {/* Compose Modal (Owner Only) */}
      <Modal visible={showCompose} animationType="slide" transparent>
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-card rounded-t-3xl p-6 border-t border-border max-h-[85%]">
            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-foreground text-xl font-bold">New Message</Text>
                <TouchableOpacity onPress={() => setShowCompose(false)}>
                  <Ionicons name="close" size={24} color={isDark ? '#f8fafc' : '#0f172a'} />
                </TouchableOpacity>
              </View>

              {/* Recipient Type */}
              <Text className="text-muted-foreground font-medium mb-2">Send To</Text>
              <View className="flex-row mb-4 space-x-2">
                {(['COMPANY', 'BRANCH', 'INDIVIDUAL'] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setComposeForm((p) => ({ ...p, recipientType: type }))}
                    className={`px-4 py-2 rounded-xl border mr-2 ${composeForm.recipientType === type ? 'bg-primary border-primary' : 'bg-muted border-border'}`}
                  >
                    <Text className={`text-xs font-bold ${composeForm.recipientType === type ? 'text-primary-foreground' : 'text-muted-foreground'}`}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Message Type */}
              <Text className="text-muted-foreground font-medium mb-2">Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                {(['ANNOUNCEMENT', 'TASK', 'REMINDER', 'ALERT'] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setComposeForm((p) => ({ ...p, messageType: type }))}
                    className={`px-4 py-2 rounded-xl border mr-2 ${composeForm.messageType === type ? 'bg-primary border-primary' : 'bg-muted border-border'}`}
                  >
                    <Text className={`text-xs font-bold ${composeForm.messageType === type ? 'text-primary-foreground' : 'text-muted-foreground'}`}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Title */}
              <Text className="text-muted-foreground font-medium mb-2">Title</Text>
              <TextInput
                className="bg-muted border border-border rounded-2xl px-4 h-12 text-foreground mb-4"
                placeholder="Message title..."
                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                value={composeForm.title}
                onChangeText={(t) => setComposeForm((p) => ({ ...p, title: t }))}
              />

              {/* Body */}
              <Text className="text-muted-foreground font-medium mb-2">Message</Text>
              <TextInput
                className="bg-muted border border-border rounded-2xl px-4 py-3 text-foreground mb-6"
                placeholder="Type your message..."
                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                value={composeForm.body}
                onChangeText={(t) => setComposeForm((p) => ({ ...p, body: t }))}
                multiline
                numberOfLines={4}
                style={{ minHeight: 100, textAlignVertical: 'top' }}
              />

              <TouchableOpacity
                onPress={handleSend}
                disabled={sendMutation.isPending}
                className="bg-primary h-14 rounded-2xl items-center justify-center"
              >
                {sendMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-primary-foreground font-bold text-lg">Send Message</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
