import React, { useRef, useState } from 'react';
import { Alert, Platform, Pressable, Text, View } from 'react-native';
import DateTimePicker from '@expo/ui/community/datetime-picker';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { Button, colors, ErrorNotice, Field, Form, Screen, s } from '../../components/ui';
import { useSession } from '../../lib/session';
import { ApiError, errorMessage, parseAmount } from '../../lib/network';
import type { EntryType } from '../../lib/types';

function localDateTime(value?: string) {
  const date = value ? new Date(value) : new Date();
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function dateTimeIso(dateValue: string, timeValue: string) {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue);
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(timeValue);
  if (!dateMatch || !timeMatch) throw new Error('Enter the date as YYYY-MM-DD and time as HH:mm.');
  const year = Number(dateMatch[1]), month = Number(dateMatch[2]), day = Number(dateMatch[3]);
  const hour = Number(timeMatch[1]), minute = Number(timeMatch[2]);
  const date = new Date(year, month - 1, day, hour, minute);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day || date.getHours() !== hour || date.getMinutes() !== minute)
    throw new Error('Enter a valid date and time.');
  return date.toISOString();
}

export default function AddEntry() {
  const { customerId, customerName, type, entryId, amount: initialAmount, description: initialDescription, date } = useLocalSearchParams<{ customerId: string; customerName: string; type: EntryType; entryId?: string; amount?: string; description?: string; date?: string }>();
  const { api } = useSession();
  const [amount, setAmount] = useState(initialAmount || ''); const [description, setDescription] = useState(initialDescription || '');
  const [initialDateTime] = useState(() => localDateTime(date));
  const [entryDate, setEntryDate] = useState(initialDateTime.slice(0, 10)); const [entryTime, setEntryTime] = useState(initialDateTime.slice(11));
  const [openPicker, setOpenPicker] = useState<'date' | 'time' | null>(null);
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [uncertain, setUncertain] = useState(false);
  const submitting = useRef(false);
  const pending = useRef<{ id?: string; type: EntryType; amount: number; description: string; date: string } | null>(null);
  const sale = type === 'sale';
  const editing = Boolean(entryId);
  const pickerValue = (() => {
    try { return new Date(dateTimeIso(entryDate, entryTime)); }
    catch { return new Date(); }
  })();
  async function save() {
    if (submitting.current) return;
    setError('');
    try {
      if (!/^\d+$/.test(customerId) || !['sale', 'payment'].includes(type)) throw new Error('Invalid entry. Open the customer account again.');
      if (!pending.current) {
        const value = parseAmount(amount);
        if (sale && !description.trim()) throw new Error('Describe what was sold.');
        pending.current = { ...(editing ? {} : { id: Crypto.randomUUID() }), type, amount: value, description: description.trim(), date: dateTimeIso(entryDate, entryTime) };
      }
      submitting.current = true; setBusy(true);
      const result = await api<{ ok: boolean }>(`/customers/${customerId}/entries${editing ? `/${entryId}` : ''}`, { method: editing ? 'PUT' : 'POST', body: pending.current });
      if (result.ok !== true) throw new Error('The server did not confirm this entry.');
      pending.current = null; setUncertain(false);
      Alert.alert(sale ? `Sale ${editing ? 'updated' : 'recorded'}` : `Payment ${editing ? 'updated' : 'recorded'}`, 'The customer balance has been updated.');
      router.back();
    } catch (error) {
      // New entry retries keep their UUID; edits can safely target the same row again.
      if (editing || (error instanceof ApiError && [400, 404, 409, 413].includes(error.status))) pending.current = null;
      setUncertain(!editing && !!pending.current); setError(errorMessage(error));
    } finally { submitting.current = false; setBusy(false); }
  }
  return <Screen><Stack.Screen options={{ title: editing ? `Edit ${sale ? 'sale' : 'payment'}` : sale ? 'New sale' : 'Record payment', headerBackVisible: !busy }} /><Form>
    <Text style={s.eyebrow}>{customerName || 'CUSTOMER ACCOUNT'}</Text><Text style={s.title}>{editing ? `Edit ${sale ? 'sale' : 'payment'}` : sale ? 'Record a sale' : 'Record a payment'}</Text><Text style={s.muted}>{editing ? 'Saving updates the customer balance.' : sale ? 'This amount adds to the customer’s balance.' : 'This amount reduces the customer’s balance.'}</Text>
    <Field label="Amount (PKR)" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0.00" editable={!busy && !uncertain} autoFocus />
    <View style={s.row}>
      <View style={{ flex: 1 }}><Text style={s.label}>Date</Text><Pressable accessibilityRole="button" accessibilityLabel={`Date, ${entryDate}`} disabled={busy || uncertain} onPress={() => setOpenPicker(openPicker === 'date' ? null : 'date')} style={s.input}><Text style={{ color: colors.navy, fontSize: 16 }}>{entryDate}</Text></Pressable></View>
      <View style={{ flex: 1 }}><Text style={s.label}>Time</Text><Pressable accessibilityRole="button" accessibilityLabel={`Time, ${entryTime}`} disabled={busy || uncertain} onPress={() => setOpenPicker(openPicker === 'time' ? null : 'time')} style={s.input}><Text style={{ color: colors.navy, fontSize: 16 }}>{entryTime}</Text></Pressable></View>
    </View>
    {openPicker && !busy && !uncertain && <DateTimePicker
      value={pickerValue}
      mode={openPicker}
      display={openPicker === 'date' ? 'inline' : 'spinner'}
      presentation={Platform.OS === 'android' ? 'dialog' : 'inline'}
      onValueChange={(_, selected) => {
        if (openPicker === 'date') setEntryDate(localDateTime(selected.toISOString()).slice(0, 10));
        else setEntryTime(`${String(selected.getHours()).padStart(2, '0')}:${String(selected.getMinutes()).padStart(2, '0')}`);
        if (Platform.OS === 'android') setOpenPicker(null);
      }}
      style={{ width: '100%' }}
    />}
    <Text style={s.muted}>Uses your device’s local time (24-hour format).</Text>
    <Field label={sale ? 'Sale description' : 'Payment note (optional)'} value={description} onChangeText={setDescription} multiline maxLength={sale ? undefined : 300} placeholder={sale ? 'What was sold?' : 'e.g. Cash payment'} editable={!busy && !uncertain} />
    <ErrorNotice message={error} />{uncertain && <Text style={s.muted}>Your details are kept unchanged. Retry uses the same reference and will not duplicate this entry. If you leave this screen, check the account history before adding it again.</Text>}
    <Button title={uncertain ? 'Retry this entry' : editing ? `Save ${sale ? 'sale' : 'payment'}` : sale ? 'Save sale' : 'Save payment'} onPress={() => { void save(); }} busy={busy} />
  </Form></Screen>;
}
