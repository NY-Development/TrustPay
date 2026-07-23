import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ShieldAlert, RefreshCw } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
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
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
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
    <View pointerEvents="box-none" style={styles.wrapper}>
      <View
        className="bg-card border border-amber-500/30"
        style={styles.card}
      >
        <View className="bg-amber-500/10" style={styles.iconWrap}>
          <ShieldAlert size={20} color="#f59e0b" />
        </View>
        <View style={styles.textWrap}>
          <Text className="text-foreground" style={styles.title}>Session expiring soon</Text>
          <Text className="text-muted-foreground" style={styles.subtitle}>
            You'll be signed out in{' '}
            <Text style={styles.countdown}>{formatCountdown(remainingMs!)}</Text>
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleRefresh}
          disabled={refreshing}
          className="bg-primary"
          style={[styles.button, refreshing && { opacity: 0.6 }]}
          activeOpacity={0.85}
        >
          <RefreshCw size={14} color={isDark ? '#000' : '#fff'} />
          <Text className="text-primary-foreground" style={styles.buttonText}>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 32,
    zIndex: 9998,
    alignItems: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  countdown: {
    fontFamily: 'monospace',
    fontWeight: '700',
    color: '#d97706',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
