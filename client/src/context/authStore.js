import { create } from 'zustand';
import { authApi } from '../api/endpoints.js';
import { onUnauthorized, setAccessToken } from '../api/client.js';

export const useAuthStore = create((set) => ({
  user: null,
  // 'loading' until the refresh cookie has been checked, so guards do not
  // bounce a signed-in user to /login on a hard reload.
  status: 'loading',

  bootstrap: async () => {
    try {
      const { user, accessToken } = await authApi.refresh();
      setAccessToken(accessToken);
      set({ user, status: 'authenticated' });
    } catch {
      setAccessToken(null);
      set({ user: null, status: 'anonymous' });
    }
  },

  signIn: async (credentials) => {
    const { user, accessToken } = await authApi.login(credentials);
    setAccessToken(accessToken);
    set({ user, status: 'authenticated' });
    return user;
  },

  signUp: async (payload) => {
    const { user, accessToken } = await authApi.register(payload);
    setAccessToken(accessToken);
    set({ user, status: 'authenticated' });
    return user;
  },

  signOut: async () => {
    try {
      await authApi.logout();
    } finally {
      setAccessToken(null);
      set({ user: null, status: 'anonymous' });
    }
  },

  setUser: (user) => set({ user }),
}));

// A refresh that fails mid-session drops the user back to anonymous.
onUnauthorized(() => {
  setAccessToken(null);
  useAuthStore.setState({ user: null, status: 'anonymous' });
});

export const homePathFor = (user) => {
  if (user?.role === 'admin') return '/admin';
  if (user?.role === 'recruiter') return '/recruiter';
  if (user?.role === 'candidate') return '/applications';
  return '/jobs';
};
