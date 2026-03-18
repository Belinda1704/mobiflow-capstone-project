import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { PrimaryButton } from '../../components/PrimaryButton';

jest.mock('../../contexts/ThemeContext', () => ({
  useThemeColors: () => ({
    colors: {
      accent: '#F5C518',
      tabBarBg: '#1A1A1A',
      surface: '#F8FAFC',
      white: '#FFFFFF',
      black: '#0F172A',
    },
  }),
}));

describe('PrimaryButton', () => {
  describe('Rendering', () => {
    it('renders the title', () => {
      render(<PrimaryButton title="Save" onPress={() => {}} />);
      expect(screen.getByText('Save')).toBeOnTheScreen();
    });

    it('renders with different variants', () => {
      const { getByText } = render(
        <PrimaryButton title="Yellow" onPress={() => {}} variant="yellow" />
      );
      expect(getByText('Yellow')).toBeOnTheScreen();
    });
  });

  describe('Press behaviour', () => {
    it('calls onPress when pressed', () => {
      const onPress = jest.fn();
      render(<PrimaryButton title="Submit" onPress={onPress} />);
      fireEvent.press(screen.getByText('Submit'));
      expect(onPress).toHaveBeenCalledTimes(1);
    });
  });

  describe('Disabled state', () => {
    it('does not call onPress when disabled', () => {
      const onPress = jest.fn();
      render(<PrimaryButton title="Submit" onPress={onPress} disabled />);
      fireEvent.press(screen.getByText('Submit'));
      expect(onPress).not.toHaveBeenCalled();
    });
  });
});
