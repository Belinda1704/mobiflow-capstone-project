import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';
import type { GestureResponderEvent } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { TabBarYellow } from '../constants/colors';

export function HapticTab(props: BottomTabBarButtonProps) {
  'use no memo';
  const { style, children, accessibilityState, ...rest } = props;
  const focused = Boolean(accessibilityState?.selected);

  const pressHandler = (ev: GestureResponderEvent) => {
    if (process.env.EXPO_OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    props.onPressIn?.(ev);
  };

  return (
    <PlatformPressable
      {...rest}
      accessibilityState={accessibilityState}
      style={[style, styles.tabButton, styles.noPill]}
      onPressIn={pressHandler}>
      <View style={styles.tabContent}>{children}</View>
      <View style={[styles.underline, { opacity: focused ? 1 : 0 }]} />
    </PlatformPressable>
  );
}

const styles = StyleSheet.create({
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noPill: {
    backgroundColor: 'transparent',
    borderRadius: 0,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  underline: {
    position: 'absolute',
    bottom: 0,
    left: '20%',
    right: '20%',
    height: 2,
    backgroundColor: TabBarYellow,
  },
});
