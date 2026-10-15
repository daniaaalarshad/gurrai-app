import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View } from 'react-native';
import { SessionProvider, useSession } from '../lib/session';
import { Button, ErrorNotice, Loading, colors, s } from '../components/ui';

function Routes() {
  const { user, loading, startupError, retry } = useSession();
  if (loading) return <Loading text="Opening Gurrai…" />;
  return <>
    {startupError && <View style={[s.card, { marginTop: 52, marginHorizontal: 20 }]}><ErrorNotice message={startupError} /><Button title="Try connection again" onPress={() => { void retry(); }} /></View>}
    <Stack screenOptions={{ headerStyle: { backgroundColor: colors.navy }, headerTintColor: colors.white, contentStyle: { backgroundColor: colors.paper } }}>
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={!user}>
        <Stack.Screen name="login" options={{ title: 'Gurrai', headerBackVisible: false }} />
      </Stack.Protected>
    </Stack>
  </>;
}
export default function RootLayout() {
  return <SafeAreaProvider><StatusBar style="light" /><SessionProvider><Routes /></SessionProvider></SafeAreaProvider>;
}
