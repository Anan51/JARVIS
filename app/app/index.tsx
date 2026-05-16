import { Redirect } from 'expo-router';

export default function Index() {
  // We redirect to the main app interface by default.
  // The auth effect in _layout.tsx will intercept this and redirect to login if the user is not authenticated.
  return <Redirect href="/(tabs)" />;
}
