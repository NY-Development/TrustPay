jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// jest-expo doesn't ship a working mock for expo-secure-store (calls resolve
// to undefined) — provide a minimal in-memory one so TokenService round-trips
// actually persist within a test, the way the real keychain/keystore does.
jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  return {
    getItemAsync: jest.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
    setItemAsync: jest.fn((key: string, value: string) => {
      store.set(key, value);
      return Promise.resolve();
    }),
    deleteItemAsync: jest.fn((key: string) => {
      store.delete(key);
      return Promise.resolve();
    }),
  };
});

jest.mock('../api/auth.api');
jest.mock('../api/branch.api');
jest.mock('@/src/providers/query-auth-sync', () => ({ clearAuthCache: jest.fn() }));

import { useAuthStore } from './authStore';
import { authApi } from '../api/auth.api';
import { branchApi } from '../api/branch.api';
import { TokenService } from '@/src/services/token.service';

const mockedAuthApi = jest.mocked(authApi);
const mockedBranchApi = jest.mocked(branchApi);

describe('mobile authStore', () => {
  beforeEach(async () => {
    await TokenService.clearTokens();
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isHydrated: false,
      actorType: null,
      branches: [],
      selectedBranch: null,
      isLoggingOut: false,
    });
    jest.clearAllMocks();
  });

  it('setUser persists tokens to SecureStore and updates state', async () => {
    const owner = { _id: 'owner-1', name: 'Owner', email: 'owner@test.dev', role: 'OWNER' } as any;

    await useAuthStore.getState().setUser(owner, { accessToken: 'access-1', refreshToken: 'refresh-1' }, {
      actorType: 'owner',
      branches: [],
      selectedBranch: undefined,
    });

    expect(await TokenService.getAccessToken()).toBe('access-1');
    expect(await TokenService.getRefreshToken()).toBe('refresh-1');
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().actorType).toBe('owner');
  });

  it('hydrate does nothing when there is no stored access token', async () => {
    await useAuthStore.getState().hydrate();

    expect(mockedAuthApi.getMe).not.toHaveBeenCalled();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().isHydrated).toBe(true);
  });

  it('hydrate loads the owner profile and branches when a token exists', async () => {
    await TokenService.saveAccessToken('valid-token');
    mockedAuthApi.getMe.mockResolvedValue({
      success: true,
      data: { actorType: 'owner', user: { _id: 'owner-1', role: 'OWNER' } },
    } as any);
    mockedBranchApi.list.mockResolvedValue({
      success: true,
      data: [{ _id: 'branch-1', branchName: 'Main' }],
    } as any);

    await useAuthStore.getState().hydrate();

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().actorType).toBe('owner');
    expect(useAuthStore.getState().selectedBranch).toEqual({ _id: 'branch-1', branchName: 'Main' });
  });

  it('hydrate clears the token when /auth/me rejects (expired token)', async () => {
    await TokenService.saveAccessToken('stale-token');
    mockedAuthApi.getMe.mockRejectedValue(new Error('401'));

    await useAuthStore.getState().hydrate();

    expect(await TokenService.getAccessToken()).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('logout clears tokens and resets state', async () => {
    await TokenService.saveAccessToken('access-1');
    useAuthStore.setState({ user: { _id: 'x' } as any, isAuthenticated: true, actorType: 'owner' });

    await useAuthStore.getState().logout();

    expect(await TokenService.getAccessToken()).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('logout is a no-op re-entrant guard while already logging out', async () => {
    useAuthStore.setState({ isLoggingOut: true });
    await useAuthStore.getState().logout();
    // Should return immediately without ever flipping isLoggingOut back to false via the finally branch.
    expect(useAuthStore.getState().isLoggingOut).toBe(true);
  });
});
