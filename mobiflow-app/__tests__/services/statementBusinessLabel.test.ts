import { resolveStatementBusinessLabel } from '../../utils/statementBusinessLabel';

describe('resolveStatementBusinessLabel', () => {
  it('uses custom business name when set', () => {
    expect(resolveStatementBusinessLabel('URUMURI', 'Jane')).toBe('URUMURI');
  });

  it('falls back to display name when business is default placeholder', () => {
    expect(resolveStatementBusinessLabel('My Business', 'URUMURI')).toBe('URUMURI');
  });

  it('falls back to display name when business is empty', () => {
    expect(resolveStatementBusinessLabel('', 'URUMURI')).toBe('URUMURI');
  });

  it('returns placeholder when both missing', () => {
    expect(resolveStatementBusinessLabel('', '')).toBe('My Business');
  });
});
