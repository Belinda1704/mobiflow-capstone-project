import { Tabs } from 'expo-router';
import React from 'react';
import { Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '../../components/haptic-tab';
import { MobiFlowColors, FontFamily, TabBarYellow } from '../../constants/colors';

function TabIcon({
  focused,
  color,
  active,
  inactive,
}: {
  focused: boolean;
  color: string;
  active: keyof typeof Ionicons.glyphMap;
  inactive: keyof typeof Ionicons.glyphMap;
}) {
  const iconName = focused ? active : inactive;
  return <Ionicons name={iconName} size={22} color={color} />;
}

function TabLabel({ focused, label }: { focused: boolean; label: string }) {
  return (
    <Text style={{ fontSize: 11, fontFamily: FontFamily.medium, color: focused ? TabBarYellow : 'rgba(255,255,255,0.7)' }}>
      {label}
    </Text>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = 68;
  const bottomPadding = Math.max(insets.bottom, 12);
  const totalBottom = tabBarHeight + bottomPadding;

  return (
    <Tabs
      sceneContainerStyle={{ paddingBottom: totalBottom + 24 }}
      screenOptions={{
        tabBarActiveTintColor: TabBarYellow,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.7)',
        tabBarActiveBackgroundColor: 'transparent',
        tabBarInactiveBackgroundColor: 'transparent',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: MobiFlowColors.tabBarBg,
          height: tabBarHeight + bottomPadding,
          paddingTop: 8,
          paddingBottom: bottomPadding,
          borderRadius: 0,
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarShowLabel: true,
        tabBarLabel: ({ focused, children }) => <TabLabel focused={focused} label={children as string} />,
        tabBarItemStyle: {
          paddingTop: 4,
          backgroundColor: 'transparent',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused} color={color} active="home" inactive="home-outline" />
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Transactions',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused} color={color} active="list" inactive="list-outline" />
          ),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused} color={color} active="bar-chart" inactive="bar-chart-outline" />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused} color={color} active="ellipsis-horizontal" inactive="ellipsis-horizontal-outline" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}