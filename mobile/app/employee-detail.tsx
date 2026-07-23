import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEmployeeDetail, useEmployees } from '@/src/hooks/useEmployee';
import { useBranches } from '@/src/hooks/useBranch';
import { StatusModal } from '@/src/components/StatusModal';

const EMPLOYEE_ROLES = ['MANAGER', 'CASHIER', 'VERIFIER', 'RECEPTIONIST', 'OTHER'];

export default function EmployeeDetailScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themePrimary = isDark ? '#3b82f6' : '#003ec7';
  
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: employeeData, isLoading } = useEmployeeDetail(id!);
  const { updateEmployee, deactivateEmployee, activateEmployee, resetEmployeePassword, moveEmployeeBranch } = useEmployees();
  const { branches } = useBranches();

  const employee = employeeData?.data;

  const [newPassword, setNewPassword] = React.useState('');
  const [showResetModal, setShowResetModal] = React.useState(false);
  const [showMoveModal, setShowMoveModal] = React.useState(false);
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [editName, setEditName] = React.useState('');
  const [editRole, setEditRole] = React.useState('CASHIER');
  const [savingEdit, setSavingEdit] = React.useState(false);
  const [modal, setModal] = React.useState<{
    visible: boolean;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  }>({ visible: false, type: 'info', title: '', message: '' });

  const handleToggleStatus = async () => {
    if (!employee) return;
    try {
      if (employee.status === 'ACTIVE') {
        await deactivateEmployee(employee._id);
        setModal({ visible: true, type: 'success', title: 'Status Deactivated', message: 'Employee status was updated to INACTIVE successfully.' });
      } else {
        await activateEmployee(employee._id);
        setModal({ visible: true, type: 'success', title: 'Status Activated', message: 'Employee status was updated to ACTIVE successfully.' });
      }
    } catch (err: any) {
      setModal({ visible: true, type: 'error', title: 'Action Failed', message: err.response?.data?.message || 'Failed to update employee status.' });
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters.');
      return;
    }
    try {
      await resetEmployeePassword({ id: employee!._id, password: newPassword });
      setShowResetModal(false);
      setNewPassword('');
      setModal({ visible: true, type: 'success', title: 'Password Reset', message: 'Employee password was reset successfully.' });
    } catch (err: any) {
      setModal({ visible: true, type: 'error', title: 'Action Failed', message: err.response?.data?.message || 'Failed to reset employee password.' });
    }
  };

  const handleOpenEdit = () => {
    if (!employee) return;
    setEditName(employee.name || '');
    setEditRole(employee.role || 'CASHIER');
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) {
      Alert.alert('Error', 'Name cannot be empty.');
      return;
    }
    setSavingEdit(true);
    try {
      await updateEmployee({ id: employee!._id, data: { name: editName.trim(), role: editRole } });
      setShowEditModal(false);
      setModal({ visible: true, type: 'success', title: 'Employee Updated', message: 'Name and role were saved successfully.' });
    } catch (err: any) {
      setModal({ visible: true, type: 'error', title: 'Update Failed', message: err.response?.data?.message || 'Failed to update employee.' });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleMoveBranch = async (branchId: string) => {
    try {
      await moveEmployeeBranch({ id: employee!._id, branchId });
      setShowMoveModal(false);
      setModal({ visible: true, type: 'success', title: 'Branch Updated', message: 'Employee has been reassigned successfully.' });
    } catch (err: any) {
      setModal({ visible: true, type: 'error', title: 'Reassignment Failed', message: err.response?.data?.message || 'Failed to reassign employee.' });
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color={themePrimary} />
      </View>
    );
  }

  if (!employee) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center p-6">
        <Text className="text-muted-foreground text-semibold">Employee not found</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4 bg-primary px-6 h-12 rounded-2xl items-center justify-center">
          <Text className="text-primary-foreground font-bold">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const employeeBranchId =
    typeof employee.branchId === 'object' && employee.branchId !== null
      ? employee.branchId._id
      : employee.branchId;
  const assignedBranch = branches.find((b) => b._id === employeeBranchId);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-grow px-6 py-4">
        <View className="flex-row items-center justify-between mb-8">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={isDark ? '#f8fafc' : '#0f172a'} />
          </TouchableOpacity>
          <Text className="text-foreground text-xl font-bold">Employee Directory</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Profile Card */}
        <View className="bg-card border border-border rounded-3xl p-6 items-center mb-6">
          <View className="w-20 h-20 bg-primary/10 rounded-full items-center justify-center mb-4">
            <Ionicons name="person" size={40} color={themePrimary} />
          </View>
          <Text className="text-foreground text-2xl font-bold mb-1 text-center">{employee.name}</Text>
          <Text className="text-muted-foreground text-base mb-3 text-center">{employee.email}</Text>
          
          <View className="flex-row items-center space-x-2">
            <View className={`px-4 py-1.5 rounded-full ${employee.status === 'ACTIVE' ? 'bg-green-500/15' : 'bg-red-500/15'}`}>
              <Text className={`text-sm font-bold ${employee.status === 'ACTIVE' ? 'text-green-500' : 'text-red-500'}`}>{employee.status}</Text>
            </View>
            <View className="bg-muted px-4 py-1.5 rounded-full border border-border ml-2">
              <Text className="text-muted-foreground text-sm font-bold">{employee.role}</Text>
            </View>
          </View>
        </View>

        {/* Info Block */}
        <View className="bg-card border border-border rounded-3xl p-6 mb-6 space-y-4">
          <Text className="text-foreground font-bold text-lg mb-2">Assignment Details</Text>
          
          <View className="flex-row justify-between items-center py-2 border-b border-border/40">
            <Text className="text-muted-foreground font-medium">Branch Link</Text>
            <Text className="text-foreground font-semibold">{assignedBranch?.branchName || 'Unknown Branch'}</Text>
          </View>
          <View className="flex-row justify-between items-center py-2 border-b border-border/40">
            <Text className="text-muted-foreground font-medium">Branch Code</Text>
            <Text className="text-primary font-mono">{assignedBranch?.branchCode || 'N/A'}</Text>
          </View>
          <View className="flex-row justify-between items-center py-2">
            <Text className="text-muted-foreground font-medium">Last Login</Text>
            <Text className="text-foreground font-semibold">
              {employee.lastLogin ? new Date(employee.lastLogin).toLocaleDateString() : 'Never logged in'}
            </Text>
          </View>
        </View>

        {/* Action Panel */}
        <View className="space-y-3 mb-10">
          <Text className="text-muted-foreground font-bold text-xs uppercase tracking-wider mb-2 ml-1">Administrative Controls</Text>

          <TouchableOpacity
            onPress={handleOpenEdit}
            className="w-full h-14 bg-muted border border-border rounded-2xl items-center justify-center flex-row space-x-2"
          >
            <Ionicons name="create-outline" size={20} color={isDark ? '#94a3b8' : '#64748b'} />
            <Text className="text-foreground font-bold text-base ml-2">Edit Name &amp; Role</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleToggleStatus}
            style={{ backgroundColor: employee.status === 'ACTIVE' ? '#ef444415' : '#10b98115' }}
            className="w-full h-14 rounded-2xl items-center justify-center border border-transparent/25 flex-row space-x-2"
          >
            <Ionicons name={employee.status === 'ACTIVE' ? 'ban-outline' : 'checkmark-circle-outline'} size={20} color={employee.status === 'ACTIVE' ? '#ef4444' : '#10b981'} />
            <Text className={`font-bold text-base ${employee.status === 'ACTIVE' ? 'text-red-500' : 'text-green-500'} ml-2`}>
              {employee.status === 'ACTIVE' ? 'Deactivate Account' : 'Activate Account'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowMoveModal(true)}
            className="w-full h-14 bg-muted border border-border rounded-2xl items-center justify-center flex-row space-x-2"
          >
            <Ionicons name="swap-horizontal-outline" size={20} color={isDark ? '#94a3b8' : '#64748b'} />
            <Text className="text-foreground font-bold text-base ml-2">Move Branch</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowResetModal(true)}
            className="w-full h-14 bg-muted border border-border rounded-2xl items-center justify-center flex-row space-x-2"
          >
            <Ionicons name="key-outline" size={20} color={isDark ? '#94a3b8' : '#64748b'} />
            <Text className="text-foreground font-bold text-base ml-2">Reset Password</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Name & Role Modal */}
      {showEditModal && (
        <View className="absolute inset-0 bg-black/60 items-center justify-center z-50 p-6">
          <View className="bg-card w-full max-w-sm rounded-[32px] p-6 border border-border">
            <Text className="text-foreground text-xl font-bold text-center mb-4">Edit Employee</Text>
            <Text className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-2">Name</Text>
            <TextInput
              placeholder="Full name"
              placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
              value={editName}
              onChangeText={setEditName}
              className="bg-muted border border-border rounded-2xl h-14 px-4 text-foreground mb-4"
            />
            <Text className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-2">Role</Text>
            <View className="flex-row flex-wrap gap-2 mb-6">
              {EMPLOYEE_ROLES.map((r) => (
                <TouchableOpacity
                  key={r}
                  onPress={() => setEditRole(r)}
                  className={`px-3 py-2 rounded-xl border ${editRole === r ? 'bg-primary border-primary' : 'bg-muted border-border'}`}
                >
                  <Text className={`text-xs font-bold ${editRole === r ? 'text-primary-foreground' : 'text-foreground'}`}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View className="flex-row justify-between">
              <TouchableOpacity onPress={() => setShowEditModal(false)} className="w-[47%] h-12 bg-muted rounded-xl items-center justify-center">
                <Text className="text-foreground font-bold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveEdit} disabled={savingEdit} className="w-[47%] h-12 bg-primary rounded-xl items-center justify-center">
                <Text className="text-primary-foreground font-bold">{savingEdit ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Password Reset Modal */}
      {showResetModal && (
        <View className="absolute inset-0 bg-black/60 items-center justify-center z-50 p-6">
          <View className="bg-card w-full max-w-sm rounded-[32px] p-6 border border-border">
            <Text className="text-foreground text-xl font-bold text-center mb-4">Reset Password</Text>
            <TextInput
              secureTextEntry
              placeholder="New password (min 6 chars)"
              placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
              value={newPassword}
              onChangeText={setNewPassword}
              className="bg-muted border border-border rounded-2xl h-14 px-4 text-foreground mb-6"
            />
            <View className="flex-row justify-between">
              <TouchableOpacity onPress={() => setShowResetModal(false)} className="w-[47%] h-12 bg-muted rounded-xl items-center justify-center">
                <Text className="text-foreground font-bold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleResetPassword} className="w-[47%] h-12 bg-primary rounded-xl items-center justify-center">
                <Text className="text-white font-bold">Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Move Branch Modal */}
      {showMoveModal && (
        <View className="absolute inset-0 bg-black/60 items-center justify-center z-50 p-6">
          <View className="bg-card w-full max-w-sm rounded-[32px] p-6 border border-border max-h-[80%]">
            <Text className="text-foreground text-xl font-bold text-center mb-4">Select Target Branch</Text>
            <ScrollView className="mb-6 space-y-2">
              {branches.map((b) => (
                <TouchableOpacity
                  key={b._id}
                  onPress={() => handleMoveBranch(b._id)}
                  className={`p-4 rounded-2xl border ${b._id === employeeBranchId ? 'bg-primary border-primary' : 'bg-muted border-border'} mb-2`}
                >
                  <Text className={`font-bold ${b._id === employeeBranchId ? 'text-primary-foreground' : 'text-foreground'}`}>
                    {b.branchName}
                  </Text>
                  <Text className={`text-xs ${b._id === employeeBranchId ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                    {b.branchCode}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity onPress={() => setShowMoveModal(false)} className="w-full h-12 bg-muted rounded-xl items-center justify-center">
              <Text className="text-foreground font-bold">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <StatusModal
        visible={modal.visible}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onClose={() => {
          setModal({ ...modal, visible: false });
        }}
      />
    </SafeAreaView>
  );
}
