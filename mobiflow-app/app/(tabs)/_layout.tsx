// Tabs: Home, Transactions, Reports, More. SMS listener when permission given. CoreDataGate waits for data.
import React, { useEffect } from 'react';
import { Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { withLayoutContext } from 'expo-router';

import { useThemeColors } from '../../contexts/ThemeContext';
import { useTranslations } from '../../hooks/useTranslations';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { FontFamily } from '../../constants/colors';
import { CoreDataGate } from '../../components/CoreDataGate';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSmsCaptureEnabled } from '../../services/preferencesService';
import { checkSmsPermissions, isSmsCaptureSupported, startSmsListener, scanPastSmsMessages } from '../../services/smsCaptureService';

const { Navigator: MaterialTopTabNavigator } = createMaterialTopTabNavigator();
const SwipeableTabs = withLayoutContext(MaterialTopTabNavigator);

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

function TabLabel({ focused, label, activeColor, inactiveColor }: { focused: boolean; label: string; activeColor: string; inactiveColor: string }) {
  return (
    <Text style={{ fontSize: 11, fontFamily: FontFamily.medium, color: focused ? activeColor : inactiveColor, textTransform: 'uppercase' }}>
      {label}
    </Text>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useThemeColors();
  const { t } = useTranslations();
  const { userId } = useCurrentUser();
  const tabBarHeight = 68;
  const tabInactiveColor = isDark ? colors.textSecondary : 'rgba(255,255,255,0.7)';

  // If SMS allowed: start listener or one-time past scan so history shows
  useEffect(() => {
    if (!userId || !isSmsCaptureSupported()) return;
    let mounted = true;
    (async () => {
      const [enabled, perms] = await Promise.all([getSmsCaptureEnabled(), checkSmsPermissions()]);
      const hasBoth = perms.hasReceiveSms && perms.hasReadSms;
      if (!mounted || !hasBoth) return;
      if (enabled) {
        startSmsListener(userId); // also runs past message scan inside
      } else {
        const pastScanKey = `@mobiflow/pastScanDone/${userId}`;
        const alreadyDone = (await AsyncStorage.getItem(pastScanKey)) === 'true';
        if (!alreadyDone) {
          scanPastSmsMessages(userId).catch(() => {}).finally(() => {
            AsyncStorage.setItem(pastScanKey, 'true');
          });
        }
      }
    })();
    return () => { mounted = false; };
  }, [userId]);
  const bottomPadding = Math.max(insets.bottom, 12);
  const totalBottom = tabBarHeight + bottomPadding;

  return (
    <CoreDataGate>
    <SwipeableTabs
      tabBarPosition="bottom"
      screenOptions={{
        swipeEnabled: true,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: tabInactiveColor,
        tabBarShowLabel: true,
        tabBarShowIcon: true,
        tabBarIndicator: () => null,
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: colors.tabBarBg,
          height: tabBarHeight + bottomPadding,
          paddingTop: 8,
          paddingBottom: bottomPadding,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarItemStyle: {
          paddingTop: 4,
        },
        tabBarLabel: ({ focused, children }: { focused: boolean; children: React.ReactNode }) => <TabLabel focused={focused} label={children as string} activeColor={colors.accent} inactiveColor={tabInactiveColor} />,
      }}>
      <SwipeableTabs.Screen
        name="index"
        options={{
          title: t('home'),
          headerShown: false,
          tabBarIcon: ({ focused, color }: { focused: boolean; color: string }) => (
            <TabIcon focused={focused} color={color} active="home" inactive="home-outline" />
          ),
        }}
      />
      <SwipeableTabs.Screen
        name="transactions"
        options={{
          title: t('transactions'),
          headerShown: false,
          tabBarIcon: ({ focused, color }: { focused: boolean; color: string }) => (
            <TabIcon focused={focused} color={color} active="list" inactive="list-outline" />
          ),
        }}
      />
      <SwipeableTabs.Screen
        name="reports"
        options={{
          title: t('reports'),
          headerShown: false,
          tabBarIcon: ({ focused, color }: { focused: boolean; color: string }) => (
            <TabIcon focused={focused} color={color} active="bar-chart" inactive="bar-chart-outline" />
          ),
        }}
      />
      <SwipeableTabs.Screen
        name="more"
        options={{
          title: t('more'),
          headerShown: false,
          tabBarIcon: ({ focused, color }: { focused: boolean; color: string }) => (
            <TabIcon focused={focused} color={color} active="ellipsis-horizontal" inactive="ellipsis-horizontal-outline" />
          ),
        }}
      />
    </SwipeableTabs>
    </CoreDataGate>
  );
}
