import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function RootLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0f0f0f',
          borderTopColor: '#1e1e1e',
        },
        tabBarActiveTintColor: '#4ade80',
        tabBarInactiveTintColor: '#555',
      }}
    >
      <Tabs.Screen
        name="(tabs)/index"
        options={{
          title: 'Liste',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(tabs)/history"
        options={{
          title: 'Geçmiş',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}