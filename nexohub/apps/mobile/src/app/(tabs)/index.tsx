import * as React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/use-theme';
import { StyleSheet } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { StyleSheet } from 'react-native';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const containerStyle = {
    ...styles.container,
    paddingTop: insets.top + 8, // extra padding for camera notch and info bar
  };

  return (
    <ThemedView style={containerStyle}>
      {/* ... rest of the component remains unchanged ... */}
    </ThemedView>
  );
}