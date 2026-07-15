import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { useColorScheme } from 'nativewind';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/src/store/authStore';
import { useSwitchBranch } from '@/src/hooks/useBranch';

export default function BranchSelector() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themePrimary = isDark ? '#3b82f6' : '#003ec7';

  const branches = useAuthStore((s) => s.branches);
  const selectedBranch = useAuthStore((s) => s.selectedBranch);
  const actorType = useAuthStore((s) => s.actorType);
  const viewAllBranches = useAuthStore((s) => s.viewAllBranches);
  const setViewAllBranches = useAuthStore((s) => s.setViewAllBranches);
  const switchBranchMutation = useSwitchBranch();

  const [isOpen, setIsOpen] = React.useState(false);

  if (!selectedBranch) return null;

  if (actorType === 'employee') {
    // Employees cannot switch branches, show static active branch
    return (
      <View className="flex-row items-center bg-muted/60 px-3 py-1.5 rounded-full border border-border">
        <Ionicons name="business" size={16} color={themePrimary} />
        <Text className="text-foreground text-xs font-bold ml-1.5">
          {selectedBranch.branchCode}
        </Text>
      </View>
    );
  }

  const handleSelectAll = () => {
    setViewAllBranches(true);
    setIsOpen(false);
  };

  const handleSelect = async (branchId: string) => {
    if (branchId === selectedBranch._id) {
      // Already the active branch — just exit the aggregated view.
      setViewAllBranches(false);
      setIsOpen(false);
      return;
    }
    try {
      await switchBranchMutation.mutateAsync(branchId);
      setIsOpen(false);
    } catch (err) {
      console.error('Failed to switch branch context', err);
    }
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setIsOpen(true)}
        className="flex-row items-center bg-muted px-4 py-2 rounded-full border border-border/80 shadow-sm active:scale-95 transition-transform"
      >
        <Ionicons name={viewAllBranches ? 'apps' : 'business'} size={16} color={themePrimary} />
        {viewAllBranches ? (
          <Text className="text-foreground text-xs font-bold ml-2 mr-1">All Branches</Text>
        ) : (
          <>
            <Text className="text-foreground text-xs font-bold ml-2 mr-1">
              {selectedBranch.branchName}
            </Text>
            <Text className="text-primary font-mono text-[10px] bg-primary/10 px-2 py-0.5 rounded-full mr-1.5">
              {selectedBranch.branchCode}
            </Text>
          </>
        )}
        <Ionicons name="chevron-down" size={12} color={isDark ? '#94a3b8' : '#64748b'} />
      </TouchableOpacity>

      <Modal visible={isOpen} animationType="slide" transparent>
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-card rounded-t-3xl p-6 border-t border-border max-h-[70%]">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-foreground text-xl font-bold">Switch Branch Context</Text>
              <TouchableOpacity onPress={() => setIsOpen(false)}>
                <Ionicons name="close" size={24} color={isDark ? '#f8fafc' : '#0f172a'} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="space-y-2">
              {/* All Branches (aggregate) */}
              <TouchableOpacity
                onPress={handleSelectAll}
                className={`p-4 rounded-2xl border flex-row justify-between items-center mb-2 ${viewAllBranches ? 'bg-primary border-primary' : 'bg-muted border-border'}`}
              >
                <View className="flex-row items-center">
                  <Ionicons
                    name="apps"
                    size={20}
                    color={viewAllBranches ? '#fff' : themePrimary}
                  />
                  <View className="ml-3">
                    <Text className={`font-bold text-sm ${viewAllBranches ? 'text-primary-foreground' : 'text-foreground'}`}>
                      All Branches
                    </Text>
                    <Text className={`text-xs mt-0.5 ${viewAllBranches ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                      Combined data from every branch
                    </Text>
                  </View>
                </View>
                {viewAllBranches && (
                  <Ionicons name="checkmark-circle" size={24} color="#fff" />
                )}
              </TouchableOpacity>

              {branches.map((b) => {
                const isSelected = !viewAllBranches && b._id === selectedBranch._id;
                return (
                  <TouchableOpacity
                    key={b._id}
                    onPress={() => handleSelect(b._id)}
                    className={`p-4 rounded-2xl border flex-row justify-between items-center mb-2 ${isSelected ? 'bg-primary border-primary' : 'bg-muted border-border'}`}
                  >
                    <View>
                      <Text className={`font-bold text-sm ${isSelected ? 'text-primary-foreground' : 'text-foreground'}`}>
                        {b.branchName}
                      </Text>
                      <Text className={`text-xs mt-0.5 ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                        {b.branchCode} • {b.city || 'No Location'}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={24} color="#fff" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}
