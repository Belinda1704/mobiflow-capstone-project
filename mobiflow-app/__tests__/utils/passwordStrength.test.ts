import { isPasswordStrong } from '../../utils/passwordStrength';

describe('isPasswordStrong', () => {
  it('returns true when all requirements are met', () => {
    expect(isPasswordStrong('Abc123!@')).toBe(true);
  });

  it('returns false when any requirement is missing', () => {
    expect(isPasswordStrong('abc123!@')).toBe(false);
    expect(isPasswordStrong('Ab1!')).toBe(false);
  });
});
