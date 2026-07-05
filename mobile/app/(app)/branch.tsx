import React, { useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { useBranch } from '../../src/hooks/useBranch';

export default function BranchScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const targetBusinessId = undefined; 
  const { branches, isLoading, error, addBranch } = useBranch(targetBusinessId);

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');

  const handleCreate = async () => {
    if (!name.trim() || !address.trim()) return;
    try {
      await addBranch({ name, address, city });
      setName('');
      setAddress('');
      setCity('');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top']}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          className="flex-1"
        >
          {/* Top Header Bar */}
          <View className="px-6 h-14 flex-row items-center">
            <TouchableOpacity 
              onPress={() => router.back()}
              className="w-10 h-10 rounded-xl bg-muted items-center justify-center border border-border"
            >
              <Ionicons name="arrow-back" size={20} color={isDark ? 'white' : 'black'} />
            </TouchableOpacity>
            <Text className="text-foreground text-xl font-bold ml-4">Branches Management</Text>
          </View>

          {/* Error Banner */}
          {error && (
            <View className="mx-6 mt-2 p-3 bg-destructive/10 border border-destructive/20 rounded-2xl">
              <Text className="text-destructive font-medium text-center">Error loading locations.</Text>
            </View>
          )}

          {/* Active Branch List */}
          <View className="flex-1 px-6 pt-4">
            {isLoading ? (
              <ActivityIndicator className="flex-1 justify-center items-center" size="large" />
            ) : (
              <FlatList
                data={branches}
                keyExtractor={(item) => item._id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 24, gap: 12 }}
                renderItem={({ item }) => (
                  <View className={`p-5 bg-card rounded-3xl border border-border shadow-sm flex-row items-center justify-between ${!item.isActive && 'opacity-60'}`}>
                    <View className="flex-1 pr-4">
                      <View className="flex-row items-center gap-2">
                        <Text className="text-lg font-bold text-foreground">{item.name}</Text>
                        {!item.isActive && (
                          <View className="bg-muted px-2 py-0.5 rounded-md">
                            <Text className="text-muted-foreground text-[10px] font-bold uppercase">Inactive</Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-sm text-muted-foreground mt-1">
                        {item.address}{item.city ? `, ${item.city}` : ''}
                      </Text>
                    </View>
                    <View className={`w-2.5 h-2.5 rounded-full ${item.isActive ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
                  </View>
                )}
              />
            )}
          </View>

          {/* Sticky Creation Form Drawer */}
          <View className="p-6 bg-card border-t border-border rounded-t-[36px] shadow-2xl">
            <Text className="text-foreground text-lg font-bold mb-4">Register New Location</Text>
            
            <View className="gap-3 mb-4">
              <TextInput 
                className="h-12 border border-input rounded-2xl px-4 bg-background text-foreground text-base"
                placeholder="Branch Name (e.g., Downtown Retail)" 
                placeholderTextColor="#94a3b8"
                value={name}
                onChangeText={setName}
              />
              <TextInput 
                className="h-12 border border-input rounded-2xl px-4 bg-background text-foreground text-base"
                placeholder="Street Address" 
                placeholderTextColor="#94a3b8"
                value={address}
                onChangeText={setAddress}
              />
              <TextInput 
                className="h-12 border border-input rounded-2xl px-4 bg-background text-foreground text-base"
                placeholder="City" 
                placeholderTextColor="#94a3b8"
                value={city}
                onChangeText={setCity}
              />
            </View>

            <TouchableOpacity 
              className="h-14 bg-primary rounded-2xl justify-center items-center active:opacity-90" 
              onPress={handleCreate}
            >
              <Text className="text-primary-foreground font-bold text-base">Register Branch</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}