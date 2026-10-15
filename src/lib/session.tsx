import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { ApiError, errorMessage, normalizeServer, request } from './network';
import type { Credentials, Session, User } from './types';

const storageKey = 'gurrai.mobile.session';
function defaultAddress() {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  if (__DEV__) {
    const host = Constants.expoConfig?.hostUri?.split(':')[0];
    if (host) return `http://${host}:3002`;
  }
  return '';
}
type SessionContext = {
  user: User | null; server: string; loading: boolean; startupError: string;
  retry: () => Promise<void>;
  signIn: (credentials: Credentials, register: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  api: <T>(path: string, options?: { method?: 'GET' | 'POST' | 'PUT' | 'DELETE'; body?: unknown }) => Promise<T>;
};
const Context = createContext<SessionContext | null>(null);
export function SessionProvider({ children }: React.PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const server = defaultAddress();
  const [loading, setLoading] = useState(true);
  const [startupError, setStartupError] = useState('');
  const token = useRef<string | null>(null);
  const forget = useCallback(async () => {
    await SecureStore.deleteItemAsync(storageKey);
    token.current = null; setUser(null);
  }, []);
  const restore = useCallback(async () => {
    try {
      const stored = await SecureStore.getItemAsync(storageKey);
      if (!stored) return;
      const base = server ? normalizeServer(server, __DEV__) : '';
      const saved: { token: string; server: string } = JSON.parse(stored);
      if (!base || saved.server !== base || !/^[a-f0-9]{64}$/.test(saved.token)) { await forget(); return; }
      token.current = saved.token;
      const data = await request<{ user: User }>(normalizeServer(base, __DEV__), '/auth/me', saved.token);
      setUser(data.user);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) await forget();
      else setStartupError(errorMessage(error));
    } finally { setLoading(false); }
  }, [forget, server]);
  const retry = useCallback(async () => {
    setLoading(true); setStartupError(''); await restore();
  }, [restore]);
  useEffect(() => { void restore(); }, [restore]);
  const api = useCallback(async <T,>(path: string, options?: { method?: 'GET' | 'POST' | 'PUT' | 'DELETE'; body?: unknown }) => {
    const usedToken = token.current;
    try { return await request<T>(normalizeServer(server, __DEV__), path, usedToken, options); }
    catch (error) {
      if (error instanceof ApiError && error.status === 401 && usedToken === token.current) await forget();
      throw error;
    }
  }, [server, forget]);
  async function signIn(credentials: Credentials, register: boolean) {
    const base = normalizeServer(server, __DEV__);
    const data = await request<Session>(base, register ? '/auth/register' : '/auth/login', null, { method: 'POST', body: credentials });
    if (!data.user || !/^[a-f0-9]{64}$/.test(data.token || '')) throw new Error('This server needs the Gurrai mobile authentication update.');
    await SecureStore.setItemAsync(storageKey, JSON.stringify({ token: data.token, server: base }));
    token.current = data.token; setUser(data.user);
  }
  async function signOut() {
    // Keep the session when logout fails so the user can retry revocation.
    try { await api('/auth/logout', { method: 'POST', body: {} }); }
    catch (error) { if (!(error instanceof ApiError && error.status === 401)) throw error; }
    await forget();
  }
  return <Context.Provider value={{ user, server, loading, startupError, retry, signIn, signOut, api }}>{children}</Context.Provider>;
}
export function useSession() {
  const context = useContext(Context);
  if (!context) throw new Error('SessionProvider is missing.');
  return context;
}
