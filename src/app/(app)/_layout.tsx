import { Stack } from 'expo-router';
import { colors } from '../../components/ui';
export default function AppLayout() {
  return <Stack screenOptions={{ headerStyle: { backgroundColor: colors.navy }, headerTintColor: colors.white, contentStyle: { backgroundColor: colors.paper } }}>
    <Stack.Screen name="index" options={{ title: 'Gurrai', headerBackVisible: false }} />
    <Stack.Screen name="customers/[id]" options={{ title: 'Customer account' }} />
    <Stack.Screen name="new-customer" options={{ title: 'Add customer' }} />
    <Stack.Screen name="entry" options={{ title: 'Record entry', gestureEnabled: false }} />
  </Stack>;
}
