import React, { useRef, useState } from 'react';
import { Text } from 'react-native';
import { router } from 'expo-router';
import { Button, ErrorNotice, Field, Form, Screen, s } from '../../components/ui';
import { useSession } from '../../lib/session';
import { errorMessage } from '../../lib/network';
import type { Customer } from '../../lib/types';
export default function NewCustomer() {
  const { api } = useSession();
  const [name, setName] = useState(''); const [phone, setPhone] = useState(''); const [address, setAddress] = useState('');
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const submitting = useRef(false);
  async function save() {
    if (submitting.current) return;
    if (!name.trim()) { setError('Enter the customer name.'); return; }
    submitting.current = true; setBusy(true); setError('');
    try {
      const customer = await api<Customer>('/customers', { method: 'POST', body: { name: name.trim(), phone: phone.trim(), address: address.trim() } });
      router.replace({ pathname: '/customers/[id]', params: { id: customer.id } });
    } catch (error) { setError(errorMessage(error)); }
    finally { submitting.current = false; setBusy(false); }
  }
  return <Screen><Form><Text style={s.title}>A new connection</Text><Text style={s.muted}>Add their details. You can start their ledger straight away.</Text>
    <Field label="Customer name" value={name} onChangeText={setName} maxLength={80} autoFocus autoCapitalize="words" editable={!busy} />
    <Field label="Phone (optional)" value={phone} onChangeText={setPhone} maxLength={50} keyboardType="phone-pad" editable={!busy} />
    <Field label="Address (optional)" value={address} onChangeText={setAddress} maxLength={300} multiline editable={!busy} />
    <ErrorNotice message={error} /><Button title="Save customer" onPress={() => { void save(); }} busy={busy} />
  </Form></Screen>;
}
