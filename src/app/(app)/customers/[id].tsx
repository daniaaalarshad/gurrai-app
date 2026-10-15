import React, { useCallback, useRef, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSession } from '../../../lib/session';
import type { Account, Entry, EntryType } from '../../../lib/types';
import { errorMessage, money } from '../../../lib/network';
import { Button, ErrorNotice, Field, Loading, Screen, colors, s } from '../../../components/ui';

export default function CustomerAccount() {
  const { id } = useLocalSearchParams<{ id: string }>(); const { api } = useSession();
  const [account, setAccount] = useState<Account | null>(null); const [loading, setLoading] = useState(true);
  const [error, setError] = useState(''); const [filter, setFilter] = useState<'all' | EntryType>('all');
  const [deleteId, setDeleteId] = useState(''); const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState(''); const [deleting, setDeleting] = useState(false);
  const generation = useRef(0);
  const load = useCallback(async () => {
    const current = ++generation.current; setLoading(true); setError('');
    try {
      if (!/^\d+$/.test(id)) throw new Error('Invalid customer. Return to the customer list.');
      const result = await api<Account>(`/customers/${id}`);
      if (current === generation.current) setAccount(result);
    } catch (error) { if (current === generation.current) setError(errorMessage(error)); }
    finally { if (current === generation.current) setLoading(false); }
  }, [api, id]);
  useFocusEffect(useCallback(() => { void load(); return () => { generation.current++; }; }, [load]));
  function add(type: EntryType) { router.push({ pathname: '/entry', params: { customerId: id, customerName: account?.customer.name, type } }); }
  function edit(entry: Entry) { router.push({ pathname: '/entry', params: { customerId: id, customerName: account?.customer.name, type: entry.type, entryId: entry.id, amount: String(entry.amount), description: entry.description, date: entry.date } }); }
  function startDelete(entryId: string) { setDeleteId(entryId); setDeletePassword(''); setDeleteError(''); }
  async function confirmDelete(entryId: string) {
    if (deleting || !deletePassword) return;
    setDeleting(true); setDeleteError('');
    try {
      const result = await api<{ ok: boolean }>(`/customers/${id}/entries/${entryId}`, { method: 'DELETE', body: { password: deletePassword } });
      if (result.ok !== true) throw new Error('The server did not confirm deletion.');
      setDeleteId(''); setDeletePassword('');
      await load();
    } catch (error) { setDeleteError(errorMessage(error)); }
    finally { setDeleting(false); }
  }
  if (!account) return <Screen>{loading ? <Loading text="Loading account…" /> : <View style={s.content}><ErrorNotice message={error} /><Button title="Retry" onPress={() => { void load(); }} /></View>}</Screen>;
  const balance = account.totals.balance;
  const entries = account.entries.filter(entry => filter === 'all' || entry.type === filter);
  return <Screen><Stack.Screen options={{ title: account.customer.name }} /><FlatList data={entries} keyExtractor={entry => entry.id} contentContainerStyle={s.content}
    refreshControl={<RefreshControl refreshing={loading} onRefresh={() => { void load(); }} tintColor={colors.navy} />}
    ListHeaderComponent={<View style={{ gap: 18, marginBottom: 18 }}>
      <Text style={s.title}>{account.customer.name}</Text><Text style={s.muted}>{[account.customer.phone, account.customer.address].filter(Boolean).join('\n') || 'No contact details added'}</Text>
      <View style={[s.card, { backgroundColor: colors.navy, borderColor: colors.navy }]}><Text style={{ color: colors.blue }}>{balance < 0 ? 'Customer credit' : 'Amount left to pay'}</Text><Text style={{ color: colors.white, fontWeight: '800', fontSize: 32 }}>{money(Math.abs(balance))}</Text><Text style={{ color: colors.blue }}>{balance < 0 ? 'Available against future sales' : balance === 0 ? 'All settled' : 'Outstanding balance'}</Text>
        <View style={{ height: 1, backgroundColor: '#3B4B5E' }} /><View style={s.row}><View style={{ flex: 1, gap: 5 }}><Text style={{ color: colors.blue }}>Total sales</Text><Text style={{ color: colors.white, fontSize: 17, fontWeight: '700' }}>{money(account.totals.sales)}</Text></View><View style={{ flex: 1, gap: 5 }}><Text style={{ color: colors.blue }}>Total paid</Text><Text style={{ color: colors.white, fontSize: 17, fontWeight: '700' }}>{money(account.totals.payments)}</Text></View></View>
      </View>
      <View style={s.row}><View style={{ flex: 1 }}><Button title="+ New sale" onPress={() => add('sale')} /></View><View style={{ flex: 1 }}><Button title="Record payment" secondary onPress={() => add('payment')} /></View></View>
      <ErrorNotice message={error} />{error && <Button title="Refresh account" secondary onPress={() => { void load(); }} />}
      <Text style={s.subtitle}>Account history</Text><View style={s.row}>{(['all', 'sale', 'payment'] as const).map(value => <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: filter === value }} onPress={() => setFilter(value)} style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10, backgroundColor: filter === value ? colors.navy : colors.blue }}><Text style={{ color: filter === value ? colors.white : colors.navy, fontWeight: '600' }}>{value === 'all' ? 'All' : value === 'sale' ? 'Sales' : 'Payments'}</Text></Pressable>)}</View>
    </View>}
    ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
    ListEmptyComponent={<View style={s.card}><Text style={s.muted}>No {filter === 'sale' ? 'sales' : filter === 'payment' ? 'payments' : 'entries'} recorded yet.</Text></View>}
    renderItem={({ item }) => <View style={s.card}><View style={[s.row, { justifyContent: 'space-between', alignItems: 'flex-start' }]}><View style={{ flex: 1, gap: 6 }}><Text style={s.label}>{item.type === 'sale' ? 'Sale' : 'Payment received'}</Text><Text style={s.muted}>{new Date(item.date).toLocaleString()}</Text></View><Text style={{ color: item.type === 'payment' ? colors.green : colors.navy, fontSize: 17, fontWeight: '700', flexShrink: 1, textAlign: 'right' }}>{item.type === 'payment' ? '−' : '+'}{money(item.amount)}</Text></View><Text selectable style={{ color: colors.navy, fontSize: 15, lineHeight: 23 }}>{item.description || 'Payment received'}</Text>
      {deleteId === item.id ? <View style={{ gap: 12, marginTop: 4 }}><Text style={s.muted}>Deleting this {item.type} updates the customer balance. Enter your account password to continue.</Text><Field label="Account password" value={deletePassword} onChangeText={setDeletePassword} secureTextEntry autoCapitalize="none" autoCorrect={false} maxLength={128} editable={!deleting} /><ErrorNotice message={deleteError} /><Button title={`Delete ${item.type}`} onPress={() => { void confirmDelete(item.id); }} busy={deleting} disabled={deletePassword.length < 12} /><Button title="Cancel" onPress={() => { setDeleteId(''); setDeletePassword(''); setDeleteError(''); }} secondary disabled={deleting} /></View>
      : <View style={[s.row, { justifyContent: 'flex-end' }]}><Pressable accessibilityRole="button" accessibilityLabel={`Edit ${item.type}`} onPress={() => edit(item)} style={{ paddingVertical: 8, paddingHorizontal: 10 }}><Text style={{ color: colors.navy, fontWeight: '700' }}>Edit</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`Delete ${item.type}`} onPress={() => startDelete(item.id)} style={{ paddingVertical: 8, paddingHorizontal: 10 }}><Text style={{ color: colors.red, fontWeight: '700' }}>Delete</Text></Pressable></View>}
    </View>}
  /></Screen>;
}
