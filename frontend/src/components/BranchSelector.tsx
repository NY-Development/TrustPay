import React, { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/src/store/authStore';
import { useSwitchBranch } from '@/src/hooks/useBranch';

export default function BranchSelector() {
  const branches = useAuthStore((s) => s.branches);
  const selectedBranch = useAuthStore((s) => s.selectedBranch);
  const actorType = useAuthStore((s) => s.actorType);
  const viewAllBranches = useAuthStore((s) => s.viewAllBranches);
  const setViewAllBranches = useAuthStore((s) => s.setViewAllBranches);
  const switchBranchMutation = useSwitchBranch();

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  if (!selectedBranch) return null;

  if (actorType === 'employee') {
    return (
      <div className="flex items-center gap-2 bg-[#eaedff] dark:bg-white/5 px-4 py-2 rounded-full border border-[#c2c6d9]/30 dark:border-white/10">
        <span className="material-symbols-outlined text-[16px] text-[#004bca]">storefront</span>
        <span className="text-xs font-bold text-[#131b2e] dark:text-white">{selectedBranch.branchName}</span>
        <span className="text-[10px] font-mono font-bold text-[#004bca] bg-[#004bca]/10 px-2 py-0.5 rounded-full">
          {selectedBranch.branchCode}
        </span>
      </div>
    );
  }

  const handleSelectAll = () => {
    setViewAllBranches(true);
    setIsOpen(false);
  };

  const handleSelect = async (branchId: string) => {
    if (branchId === selectedBranch._id) {
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
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center gap-2 bg-white dark:bg-[#131b2e] px-4 py-2 rounded-full border border-[#c2c6d9]/40 dark:border-white/10 shadow-xs hover:shadow-sm transition-all cursor-pointer"
      >
        <span className="material-symbols-outlined text-[16px] text-[#004bca]">
          {viewAllBranches ? 'apps' : 'storefront'}
        </span>
        {viewAllBranches ? (
          <span className="text-xs font-bold text-[#131b2e] dark:text-white">All Branches</span>
        ) : (
          <>
            <span className="text-xs font-bold text-[#131b2e] dark:text-white">{selectedBranch.branchName}</span>
            <span className="text-[10px] font-mono font-bold text-[#004bca] bg-[#004bca]/10 px-2 py-0.5 rounded-full">
              {selectedBranch.branchCode}
            </span>
          </>
        )}
        <span className={`material-symbols-outlined text-[16px] text-[#54647a] transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          expand_more
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/30 dark:border-white/10 rounded-2xl shadow-lg z-50 p-2 max-h-80 overflow-y-auto">
          <button
            onClick={handleSelectAll}
            className={`w-full text-left p-3 rounded-xl flex items-center justify-between transition-colors mb-1 ${
              viewAllBranches ? 'bg-[#004bca] text-white' : 'hover:bg-[#faf8ff] dark:hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[18px]">apps</span>
              <div>
                <p className={`text-xs font-bold ${viewAllBranches ? 'text-white' : 'text-[#131b2e] dark:text-white'}`}>All Branches</p>
                <p className={`text-[10px] ${viewAllBranches ? 'text-white/80' : 'text-[#54647a] dark:text-[#c2c6d9]'}`}>
                  Combined data from every branch
                </p>
              </div>
            </div>
            {viewAllBranches && <span className="material-symbols-outlined text-[18px]">check_circle</span>}
          </button>

          {branches.map((b) => {
            const isSelected = !viewAllBranches && b._id === selectedBranch._id;
            return (
              <button
                key={b._id}
                onClick={() => handleSelect(b._id)}
                disabled={switchBranchMutation.isPending}
                className={`w-full text-left p-3 rounded-xl flex items-center justify-between transition-colors mb-1 disabled:opacity-50 ${
                  isSelected ? 'bg-[#004bca] text-white' : 'hover:bg-[#faf8ff] dark:hover:bg-white/5'
                }`}
              >
                <div>
                  <p className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-[#131b2e] dark:text-white'}`}>{b.branchName}</p>
                  <p className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-[#54647a] dark:text-[#c2c6d9]'}`}>
                    {b.branchCode} • {b.city || 'No Location'}
                  </p>
                </div>
                {isSelected && <span className="material-symbols-outlined text-[18px]">check_circle</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
