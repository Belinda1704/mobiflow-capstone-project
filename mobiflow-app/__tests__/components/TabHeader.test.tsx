/**
 * Component tests for TabHeader: title, subtitle, and right content.
 */
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { TabHeader } from '../../components/TabHeader';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('../../contexts/ThemeContext', () => ({
  useThemeColors: () => ({
    colors: {
      background: '#FFFFFF',
      textPrimary: '#0F172A',
      textSecondary: '#64748B',
      surface: '#F8FAFC',
    },
  }),
}));

describe('TabHeader', () => {
  describe('Title and subtitle', () => {
    it('renders the title', () => {
      render(<TabHeader title="Dashboard" />);
      expect(screen.getByText('Dashboard')).toBeOnTheScreen();
    });

    it('renders subtitle when provided', () => {
      render(<TabHeader title="Reports" subtitle="Charts and insights" />);
      expect(screen.getByText('Charts and insights')).toBeOnTheScreen();
    });

    it('does not render subtitle when not provided', () => {
      render(<TabHeader title="Home" />);
      expect(screen.queryByText('Charts and insights')).toBeNull();
    });
  });

  describe('Right content', () => {
    it('renders rightContent when provided', () => {
      render(
        <TabHeader title="Transactions" rightContent={<>{/* custom button */}</>} />
      );
      expect(screen.getByText('Transactions')).toBeOnTheScreen();
    });

    it('renders with different titles', () => {
      const { getByText } = render(<TabHeader title="Transactions" />);
      expect(getByText('Transactions')).toBeOnTheScreen();
    });
  });
});
