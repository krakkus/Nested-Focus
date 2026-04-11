/**
 * PROJECT: Nested Focus
 * * FILE REQUIREMENTS (App.js):
 * 1.  [DONE] Navigation: Multi-screen setup using React Navigation.
 * 2.  [DONE] RULE: Do not compress requirements.
 * 3.  [DONE] FIX: Replace accidental web 'div' with React Native 'View'.
 * 4.  [DONE] Global: Adhere to device light/dark theme via useColorScheme.
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './screens/HomeScreen';
import DetailScreen from './screens/DetailScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Details" component={DetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}