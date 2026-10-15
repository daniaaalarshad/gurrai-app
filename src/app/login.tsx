import React, { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { Button, ErrorNotice, Field, Form, Screen, s } from '../components/ui';
import { useSession } from '../lib/session';
import { errorMessage } from '../lib/network';

export default function Login() {
  const { signIn, server } = useSession();
  const [register, setRegister] = useState(false);
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [name, setName] = useState(''); const [businessName, setBusinessName] = useState('');
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const submitting = useRef(false);
  async function submit() {
    if (submitting.current) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Enter a valid email address.'); return; }
    if (password.length < 12 || password.length > 128) { setError('Use a password between 12 and 128 characters.'); return; }
    if (register && (!name.trim() || !businessName.trim())) { setError('Enter your name and business name.'); return; }
    submitting.current = true; setBusy(true); setError('');
    try { await signIn({ email: email.trim().toLowerCase(), password, ...(register ? { name: name.trim(), businessName: businessName.trim() } : {}) }, register); }
    catch (error) { setError(errorMessage(error)); }
    finally { submitting.current = false; setBusy(false); }
  }
  return <Screen><Form>
    <View style={{ gap: 10, marginTop: 18, marginBottom: 12 }}><Text style={s.eyebrow}>YOUR BUSINESS, IN BALANCE</Text><Text style={s.title}>{register ? 'Start with Gurrai' : 'Welcome back'}</Text><Text style={s.muted}>{register ? 'Create your business account to get started.' : 'Your customers and their accounts, together.'}</Text></View>
    {register && <><Field label="Business name" value={businessName} onChangeText={setBusinessName} maxLength={100} editable={!busy} autoCapitalize="words" /><Field label="Your name" value={name} onChangeText={setName} maxLength={80} editable={!busy} autoComplete="name" /></>}
    <Field label="Email" value={email} onChangeText={setEmail} maxLength={254} editable={!busy} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" />
    <Field label="Password" value={password} onChangeText={setPassword} maxLength={128} editable={!busy} secureTextEntry autoCapitalize="none" autoCorrect={false} autoComplete={register ? 'new-password' : 'current-password'} onSubmitEditing={() => { void submit(); }} />
    {register && <Text style={s.muted}>Use 12–128 characters.</Text>}
    <ErrorNotice message={error} />
    <Button title={register ? 'Create account' : 'Sign in'} onPress={() => { void submit(); }} busy={busy} disabled={!server} />
    <Button title={register ? 'Already registered? Sign in' : 'New business? Create an account'} secondary disabled={busy} onPress={() => { setRegister(!register); setError(''); }} />
    {!server && <ErrorNotice message="Gurrai is unavailable. Please contact support." />}
  </Form></Screen>;
}
