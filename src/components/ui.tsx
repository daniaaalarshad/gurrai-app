import React from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const colors = { navy: '#182331', muted: '#68788B', paper: '#F3F6FA', border: '#DDE5EE', blue: '#DCE8F5', green: '#18745A', red: '#AA353D', white: '#FFFFFF' };
export function Screen({ children }: React.PropsWithChildren) {
  return <SafeAreaView style={s.screen} edges={['bottom', 'left', 'right']}><KeyboardAvoidingView style={s.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}>{children}</KeyboardAvoidingView></SafeAreaView>;
}
export function Form({ children }: React.PropsWithChildren) {
  return <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>{children}</ScrollView>;
}
export function Button({ title, onPress, busy = false, secondary = false, disabled = false }: { title: string; onPress: () => void; busy?: boolean; secondary?: boolean; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled: disabled || busy, busy }} onPress={onPress} disabled={busy || disabled} style={({ pressed }) => [s.button, secondary && s.secondaryButton, (pressed || busy || disabled) && { opacity: 0.6 }]}>
    {busy && <ActivityIndicator color={secondary ? colors.navy : colors.white} />}<Text style={[s.buttonText, secondary && { color: colors.navy }]}>{title}</Text>
  </Pressable>;
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return <View style={s.field}><Text style={s.label}>{label}</Text><TextInput accessibilityLabel={label} placeholderTextColor={colors.muted} {...props} style={[s.input, props.multiline && s.multiline, props.style]} /></View>;
}
export function ErrorNotice({ message }: { message: string }) {
  return message ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={s.error}>{message}</Text> : null;
}
export function Loading({ text = 'Loading…' }: { text?: string }) {
  return <View style={s.center}><ActivityIndicator color={colors.navy} size="large" /><Text style={s.muted}>{text}</Text></View>;
}
export const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { padding: 22, gap: 18, flexGrow: 1, maxWidth: 720, width: '100%', alignSelf: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 16 },
  title: { fontSize: 30, fontWeight: '800', color: colors.navy, letterSpacing: -0.7 },
  subtitle: { fontSize: 19, fontWeight: '700', color: colors.navy },
  eyebrow: { color: colors.muted, fontSize: 11, fontWeight: '700', letterSpacing: 2 },
  muted: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  card: { backgroundColor: colors.white, padding: 20, borderRadius: 18, borderColor: colors.border, borderWidth: 1, gap: 14 },
  field: { gap: 8 }, label: { color: colors.navy, fontWeight: '600', fontSize: 13 },
  input: { backgroundColor: colors.white, borderColor: colors.border, borderWidth: 1, borderRadius: 12, minHeight: 52, paddingHorizontal: 15, paddingVertical: 12, color: colors.navy, fontSize: 16 },
  multiline: { minHeight: 130, textAlignVertical: 'top' },
  button: { minHeight: 52, borderRadius: 12, backgroundColor: colors.navy, padding: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 },
  buttonText: { fontSize: 15, fontWeight: '700', color: colors.white }, secondaryButton: { backgroundColor: colors.blue },
  error: { color: colors.red, backgroundColor: '#FFF0F0', padding: 14, borderRadius: 10, fontSize: 14, lineHeight: 21 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  divider: { height: 1, backgroundColor: colors.border },
});
