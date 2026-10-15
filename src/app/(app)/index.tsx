import React, { useCallback, useRef, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSession } from '../../lib/session';
import type { Customer } from '../../lib/types';
import { errorMessage } from '../../lib/network';
import { Button, ErrorNotice, Field, Loading, Screen, colors, s } from '../../components/ui';

export default function Customers() {
  const { api, user, signOut } = useSession();
  const [customers, setCustomers] = useState<Customer[]>([]); const [loading, setLoading] = useState(true);
  const [error, setError] = useState(''); const [query, setQuery] = useState(''); const [leaving, setLeaving] = useState(false);
  const generation = useRef(0);
  const load = useCallback(async () => {
    const current = ++generation.current; setLoading(true); setError('');
    try { const data = await api<Customer[]>('/customers'); if (current === generation.current) setCustomers(data); }
    catch (error) { if (current === generation.current) setError(errorMessage(error)); }
    finally { if (current === generation.current) setLoading(false); }
  }, [api]);
  useFocusEffect(useCallback(() => { void load(); return () => { generation.current++; }; }, [load]));
  function logout() {
    Alert.alert('Sign out?', 'Your customer records are saved on the server.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Sign out', onPress: async () => {
      setLeaving(true); try { await signOut(); } catch (error) { setError(errorMessage(error)); } finally { setLeaving(false); }
    } }]);
  }
  const filtered = customers.filter(customer => `${customer.name} ${customer.phone}`.toLowerCase().includes(query.toLowerCase().trim()));
  return <Screen><FlatList data={filtered} keyExtractor={item => String(item.id)} keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}
    refreshControl={<RefreshControl refreshing={loading && customers.length > 0} onRefresh={() => { void load(); }} tintColor={colors.navy} />}
    ListHeaderComponent={<View style={{ gap: 18, marginBottom: 18 }}>
      <View style={[s.row, { justifyContent: 'space-between' }]}><View style={{ flex: 1 }}><Text style={s.eyebrow}>{user?.businessName}</Text><Text style={s.title}>Customers</Text></View><Button title="Sign out" secondary busy={leaving} onPress={logout} /></View>
      <Text style={s.muted}>Your customers, all in one place.</Text><Button title="+  Add customer" onPress={() => router.push('/new-customer')} />
      <Field label="Find a customer" placeholder="Search name or phone" value={query} onChangeText={setQuery} autoCorrect={false} />
      <ErrorNotice message={error} />{error && <Button title="Retry" secondary onPress={() => { void load(); }} />}
    </View>}
    ListEmptyComponent={loading ? <Loading text="Loading customers…" /> : <View style={s.card}><Text style={s.subtitle}>{query ? 'No matching customers' : 'Your first customer starts here'}</Text><Text style={s.muted}>{query ? 'Try a different name or phone number.' : 'Add a customer to start recording sales and payments.'}</Text></View>}
    ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
    renderItem={({ item }) => <Pressable accessibilityRole="button" accessibilityLabel={`Open ${item.name}'s account`} onPress={() => router.push({ pathname: '/customers/[id]', params: { id: item.id } })} style={({ pressed }) => [s.card, s.row, pressed && { backgroundColor: colors.blue }]}>
      <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' }}><Text style={s.subtitle}>{item.name.slice(0, 1).toUpperCase()}</Text></View><View style={{ flex: 1, gap: 5 }}><Text style={s.subtitle}>{item.name}</Text><Text style={s.muted}>{item.phone || 'No phone number'}</Text></View><Text style={{ fontSize: 28, color: colors.muted }}>›</Text>
    </Pressable>} /></Screen>;
}
