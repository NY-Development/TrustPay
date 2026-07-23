import React from 'react';
import { RefreshCw, ShieldAlert } from 'lucide-react';
import { useAuthStore } from '@/src/store/authStore';
import { TokenService } from '@/src/services/token.service';
import { refreshSession } from '@/src/api/client';
import { decodeJwtExpiry } from '@/src/utils/jwt';

const WARNING_WINDOW_MS = 2 * 60 * 1000; // show the banner in the last 2 minutes

function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export const SessionExpiryBanner: React.FC = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [remainingMs, setRemainingMs] = React.useState<number | null>(null);
  const [refreshing, setRefreshing] = React.useState(false);

  React.useEffect(() => {
    if (!isAuthenticated) {
      setRemainingMs(null);
      return;
    }

    let cancelled = false;

    const tick = async () => {
      const token = await TokenService.getAccessToken();
      if (cancelled) return;

      if (!token) {
        setRemainingMs(null);
        return;
      }

      const expiresAt = decodeJwtExpiry(token);
      if (!expiresAt) {
        setRemainingMs(null);
        return;
      }

      setRemainingMs(expiresAt - Date.now());
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isAuthenticated]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const newToken = await refreshSession();
      if (!newToken) throw new Error('Refresh returned no token');
      const expiresAt = decodeJwtExpiry(newToken);
      setRemainingMs(expiresAt ? expiresAt - Date.now() : null);
    } catch {
      await useAuthStore.getState().logout('expired');
    } finally {
      setRefreshing(false);
    }
  };

  const visible = isAuthenticated && remainingMs !== null && remainingMs > 0 && remainingMs <= WARNING_WINDOW_MS;

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2rem)] max-w-md px-2">
      <div className="flex items-center gap-4 bg-white dark:bg-[#131b2e] border border-amber-500/30 rounded-2xl shadow-2xl px-5 py-4">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
          <ShieldAlert size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[#131b2e] dark:text-white">Session expiring soon</p>
          <p className="text-xs text-[#54647a] dark:text-[#c2c6d9]">
            You'll be signed out in <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{formatCountdown(remainingMs!)}</span>
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="shrink-0 flex items-center gap-1.5 bg-[#004bca] hover:bg-[#0061ff] disabled:opacity-60 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh Session'}
        </button>
      </div>
    </div>
  );
};
