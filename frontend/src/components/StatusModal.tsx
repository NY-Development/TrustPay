import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface StatusModalProps {
  visible: boolean;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
  onClose: () => void;
}

export const StatusModal: React.FC<StatusModalProps> = ({ 
  visible, 
  type, 
  title, 
  message, 
  onClose 
}) => {
  if (!visible) return null;

  const iconColorClass = 
    type === 'success' 
      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
      : type === 'error' 
        ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' 
        : 'bg-blue-500/10 text-blue-500 border-blue-500/20';

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-sm bg-white dark:bg-[#131b2e] rounded-3xl border border-[#c2c6d9]/30 shadow-2xl p-6 md:p-8 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-[#54647a] hover:text-[#131b2e] dark:hover:text-white transition-colors"
        >
          <X size={18} />
        </button>

        {/* Icon wrapper */}
        <div className={`w-16 h-16 rounded-full border flex items-center justify-center mb-5 ${iconColorClass}`}>
          {type === 'success' && <CheckCircle2 size={32} />}
          {type === 'error' && <AlertCircle size={32} />}
          {type === 'info' && <Info size={32} />}
        </div>
        
        <h3 className="text-xl font-bold mb-2 text-[#131b2e] dark:text-white leading-tight">{title}</h3>
        <p className="text-sm text-[#424656] dark:text-[#c2c6d9] mb-6 leading-relaxed">{message}</p>
        
        <button 
          onClick={onClose}
          className="w-full bg-[#004bca] hover:bg-[#0061ff] active:scale-95 text-white font-bold py-3 rounded-xl transition-all cursor-pointer shadow-sm text-sm uppercase tracking-wider"
        >
          Continue
        </button>
      </div>
    </div>
  );
};
