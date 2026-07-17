import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  useEmployee,
  useDeactivateEmployee,
  useActivateEmployee,
  useResetEmployeePassword,
  useMoveEmployeeBranch,
} from '@/src/hooks/useEmployee';
import { listBranchesApi } from '@/src/api/branch.api';
import { StatusModal } from '@/src/components/StatusModal';

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: employeeRes, isLoading } = useEmployee(id || '');
  const employee = employeeRes?.data as any;

  const { data: branchesRes } = useQuery({
    queryKey: ['branches'],
    queryFn: listBranchesApi,
  });
  const branches = branchesRes?.data || [];

  const deactivateMutation = useDeactivateEmployee();
  const activateMutation = useActivateEmployee();
  const resetPasswordMutation = useResetEmployeePassword();
  const moveBranchMutation = useMoveEmployeeBranch();

  const [showResetModal, setShowResetModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [modal, setModal] = useState<{
    visible: boolean;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  }>({ visible: false, type: 'info', title: '', message: '' });

  const handleToggleStatus = () => {
    if (!employee) return;
    const mutation = employee.status === 'ACTIVE' ? deactivateMutation : activateMutation;
    mutation.mutate(employee._id, {
      onSuccess: () => {
        setModal({
          visible: true,
          type: 'success',
          title: employee.status === 'ACTIVE' ? 'Status Deactivated' : 'Status Activated',
          message: `Employee status was updated to ${employee.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'} successfully.`,
        });
      },
      onError: (err: any) => {
        setModal({ visible: true, type: 'error', title: 'Action Failed', message: err.response?.data?.message || 'Failed to update employee status.' });
      },
    });
  };

  const handleResetPassword = () => {
    if (!newPassword || newPassword.length < 6) {
      setModal({ visible: true, type: 'error', title: 'Input Error', message: 'Password must be at least 6 characters.' });
      return;
    }
    resetPasswordMutation.mutate(
      { id: employee._id, data: { password: newPassword } },
      {
        onSuccess: () => {
          setShowResetModal(false);
          setNewPassword('');
          setModal({ visible: true, type: 'success', title: 'Password Reset', message: 'Employee password was reset successfully.' });
        },
        onError: (err: any) => {
          setModal({ visible: true, type: 'error', title: 'Action Failed', message: err.response?.data?.message || 'Failed to reset employee password.' });
        },
      }
    );
  };

  const handleMoveBranch = (branchId: string) => {
    moveBranchMutation.mutate(
      { id: employee._id, data: { branchId } },
      {
        onSuccess: () => {
          setShowMoveModal(false);
          setModal({ visible: true, type: 'success', title: 'Branch Updated', message: 'Employee has been reassigned successfully.' });
        },
        onError: (err: any) => {
          setModal({ visible: true, type: 'error', title: 'Reassignment Failed', message: err.response?.data?.message || 'Failed to reassign employee.' });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-3 border-[#004bca] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="max-w-xl mx-auto text-center py-20">
        <p className="text-[#54647a] dark:text-[#c2c6d9] font-semibold mb-4">Employee not found</p>
        <Link
          to="/dashboard/employees"
          className="inline-block bg-[#004bca] hover:bg-[#0061ff] text-white px-6 py-3 rounded-xl text-sm font-bold transition-all"
        >
          Go Back
        </Link>
      </div>
    );
  }

  const employeeBranchId =
    typeof employee.branchId === 'object' && employee.branchId !== null ? employee.branchId._id : employee.branchId;
  const assignedBranch = branches.find((b: any) => b._id === employeeBranchId) || (typeof employee.branchId === 'object' ? employee.branchId : null);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link
          to="/dashboard/employees"
          className="p-2 rounded-full hover:bg-[#eaedff] dark:hover:bg-white/10 transition-colors"
        >
          <span className="material-symbols-outlined text-[#131b2e] dark:text-white">arrow_back</span>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#131b2e] dark:text-white font-['Geist']">Employee Directory</h1>
          <p className="text-sm text-[#54647a] dark:text-[#c2c6d9] mt-1">{employee.name}</p>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/35 rounded-[32px] p-8 shadow-xs flex flex-col items-center text-center mb-6">
        <div className="w-20 h-20 bg-[#004bca]/10 rounded-full flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-[40px] text-[#004bca]">person</span>
        </div>
        <h2 className="text-2xl font-bold text-[#131b2e] dark:text-white mb-1">{employee.name}</h2>
        <p className="text-[#54647a] dark:text-[#c2c6d9] mb-3">{employee.email}</p>

        <div className="flex items-center gap-2">
          <span className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase ${
            employee.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500' :
            employee.status === 'INACTIVE' ? 'bg-amber-500/10 text-amber-500' :
            'bg-red-500/10 text-red-500'
          }`}>
            {employee.status}
          </span>
          <span className="px-4 py-1.5 rounded-full text-sm font-bold bg-[#faf8ff] dark:bg-[#0b0e14] border border-[#c2c6d9]/30 text-[#54647a] dark:text-[#c2c6d9]">
            {employee.role}
          </span>
        </div>
      </div>

      {/* Assignment Details */}
      <div className="bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/35 rounded-[32px] p-8 shadow-xs mb-6">
        <h3 className="text-lg font-bold text-[#131b2e] dark:text-white mb-4">Assignment Details</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center py-2 border-b border-[#c2c6d9]/20">
            <span className="text-[#54647a] dark:text-[#c2c6d9]">Branch Link</span>
            <span className="font-semibold text-[#131b2e] dark:text-white">{assignedBranch?.branchName || 'Unknown Branch'}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-[#c2c6d9]/20">
            <span className="text-[#54647a] dark:text-[#c2c6d9]">Branch Code</span>
            <span className="font-mono font-semibold text-[#004bca]">{assignedBranch?.branchCode || 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-[#54647a] dark:text-[#c2c6d9]">Last Login</span>
            <span className="font-semibold text-[#131b2e] dark:text-white">
              {employee.lastLogin ? new Date(employee.lastLogin).toLocaleDateString() : 'Never logged in'}
            </span>
          </div>
        </div>
      </div>

      {/* Administrative Controls */}
      <div className="bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/35 rounded-[32px] p-8 shadow-xs mb-10">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#54647a] dark:text-[#c2c6d9] mb-4">Administrative Controls</h3>
        <div className="space-y-3">
          <button
            onClick={handleToggleStatus}
            className={`w-full py-3 rounded-xl text-sm font-bold transition-colors cursor-pointer flex items-center justify-center gap-2 ${
              employee.status === 'ACTIVE' ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {employee.status === 'ACTIVE' ? 'block' : 'check_circle'}
            </span>
            {employee.status === 'ACTIVE' ? 'Deactivate Account' : 'Activate Account'}
          </button>

          <button
            onClick={() => setShowMoveModal(true)}
            className="w-full py-3 rounded-xl text-sm font-bold bg-[#faf8ff] dark:bg-[#0b0e14] border border-[#c2c6d9]/30 dark:border-white/10 text-[#131b2e] dark:text-white hover:bg-[#eaedff] dark:hover:bg-white/10 transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
            Move Branch
          </button>

          <button
            onClick={() => setShowResetModal(true)}
            className="w-full py-3 rounded-xl text-sm font-bold bg-[#faf8ff] dark:bg-[#0b0e14] border border-[#c2c6d9]/30 dark:border-white/10 text-[#131b2e] dark:text-white hover:bg-[#eaedff] dark:hover:bg-white/10 transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">key</span>
            Reset Password
          </button>
        </div>
      </div>

      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-6">
          <div className="bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/30 dark:border-white/10 rounded-3xl p-8 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-bold text-center text-[#131b2e] dark:text-white mb-6">Reset Password</h3>
            <input
              type="password"
              placeholder="New password (min 6 chars)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-[#faf8ff] dark:bg-[#0b0e14] border border-[#c2c6d9]/30 dark:border-white/10 rounded-xl px-4 py-3 text-sm outline-none text-[#131b2e] dark:text-white mb-6"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowResetModal(false); setNewPassword(''); }}
                className="flex-1 bg-[#faf8ff] dark:bg-[#0b0e14] border border-[#c2c6d9]/30 dark:border-white/10 py-3 rounded-xl text-sm font-bold text-[#131b2e] dark:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleResetPassword}
                disabled={resetPasswordMutation.isPending}
                className="flex-1 bg-[#004bca] hover:bg-[#0061ff] text-white py-3 rounded-xl text-sm font-bold disabled:opacity-50 cursor-pointer"
              >
                {resetPasswordMutation.isPending ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Move Branch Modal */}
      {showMoveModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-6">
          <div className="bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/30 dark:border-white/10 rounded-3xl p-8 max-w-sm w-full shadow-2xl max-h-[80vh] flex flex-col">
            <h3 className="text-xl font-bold text-center text-[#131b2e] dark:text-white mb-6">Select Target Branch</h3>
            <div className="space-y-2 overflow-y-auto mb-6">
              {branches.map((b: any) => (
                <button
                  key={b._id}
                  onClick={() => handleMoveBranch(b._id)}
                  disabled={moveBranchMutation.isPending}
                  className={`w-full text-left p-4 rounded-2xl border transition-colors cursor-pointer disabled:opacity-50 ${
                    b._id === employeeBranchId
                      ? 'bg-[#004bca] border-[#004bca] text-white'
                      : 'bg-[#faf8ff] dark:bg-[#0b0e14] border-[#c2c6d9]/30 dark:border-white/10 text-[#131b2e] dark:text-white hover:bg-[#eaedff] dark:hover:bg-white/10'
                  }`}
                >
                  <p className="font-bold text-sm">{b.branchName}</p>
                  <p className={`text-xs ${b._id === employeeBranchId ? 'text-white/80' : 'text-[#54647a] dark:text-[#c2c6d9]'}`}>{b.branchCode}</p>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowMoveModal(false)}
              className="w-full bg-[#faf8ff] dark:bg-[#0b0e14] border border-[#c2c6d9]/30 dark:border-white/10 py-3 rounded-xl text-sm font-bold text-[#131b2e] dark:text-white cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <StatusModal
        visible={modal.visible}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onClose={() => setModal({ ...modal, visible: false })}
      />
    </div>
  );
}
