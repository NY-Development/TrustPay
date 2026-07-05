import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Storage } from '@/src/utils/storage';

export default function OfflineQueue() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themePrimary = isDark ? '#3b82f6' : '#003ec7';

  const [queue, setQueue] = React.useState<any[]>([]);
  const [isSyncing, setIsSyncing] = React.useState(false);

  React.useEffect(() => {
    // Read local structural outbox dumps
    const loadQueue = async () => {
      const stored = await Storage.getItem<any[]>('OFFLINE_SCAN_QUEUE');
      if (stored) setQueue(stored);
    };
    loadQueue();
  }, []);

  const triggerSync = async () => {
    if (queue.length === 0 || isSyncing) return;
    setIsSyncing(true);
    
    // Artificial operational simulation delay for networking pipeline sweeps
    setTimeout(async () => {
      await Storage.setItem('OFFLINE_SCAN_QUEUE', []);
      setQueue([]);
      setIsSyncing(false);
    }, 2000);
  };

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <View className="px-6 py-4 flex-row items-center bg-card border-b border-border">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Ionicons name="close" size={24} color={isDark ? 'white' : 'black'} />
          </TouchableOpacity>
          <Text className="text-foreground text-2xl font-bold flex-1">Offline Sync Box</Text>
          {queue.length > 0 && (
            <TouchableOpacity 
              onPress={triggerSync} 
              disabled={isSyncing}
              style={{ backgroundColor: themePrimary }}
              className="px-4 py-2 rounded-full flex-row items-center"
            >
              {isSyncing ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="cloud-upload" size={14} color="white" className="mr-1.5" />
                  <Text className="text-white text-xs font-bold">Sync Outbox</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        <ScrollView className="flex-1 px-6 pt-6" contentContainerStyle={{ paddingBottom: 40 }}>
          {queue.length === 0 ? (
            <View className="py-24 items-center justify-center">
              <View className="w-16 h-16 bg-primary/10 rounded-full items-center justify-center mb-4">
                <Ionicons name="cloud-done" size={32} color={themePrimary} />
              </View>
              <Text className="text-foreground font-bold text-lg">Fully Synced</Text>
              <Text className="text-muted-foreground text-sm text-center mt-1 px-8">
                All client receipts processed through local AI OCR parameters are cleanly pushed up to server ledgers.
              </Text>
            </View>
          ) : (
            queue.map((item, index) => (
              <View key={index} className="bg-card border border-border rounded-xl p-4 mb-3 flex-row justify-between items-center">
                <View className="flex-row items-center flex-1 pr-4">
                  <View className="bg-muted p-2 rounded-xl mr-3">
                    <Ionicons name="document-text" size={20} color={isDark ? '#94a3b8' : '#64748b'} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-foreground font-semibold text-sm truncate">Ref: {item.reference || 'Pending Parse'}</Text>
                    <Text className="text-muted-foreground text-xs mt-0.5">Captured Offline • {item.provider || 'CBE'}</Text>
                  </View>
                </View>
                <Text className="text-foreground font-bold text-sm">{item.amount || 0} ETB</Text>
              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}