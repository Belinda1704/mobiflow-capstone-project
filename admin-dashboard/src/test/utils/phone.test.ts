import { describe, it, expect } from 'vitest';
import {
  normalizeRwandaPhone,
  phoneToAuthId,
  normalizeAdminIdentifier,
  validateAdminIdentifier,
  validateRwandaPhone,
  formatAdminLabel,
} from '../../utils/phone';

describe('Phone and admin identifier utilities', () => {
  describe('normalizeRwandaPhone', () => {
    describe('Empty and invalid input', () => {
      it('returns empty string for empty or non-digit input', () => {
        expect(normalizeRwandaPhone('')).toBe('');
        expect(normalizeRwandaPhone('   ')).toBe('');
        expect(normalizeRwandaPhone('abc')).toBe('');
      });
    });
    describe('Valid numbers', () => {
      it('normalizes 250-prefixed 12-digit number', () => {
        expect(normalizeRwandaPhone('250781234567')).toBe('250781234567');
        expect(normalizeRwandaPhone('250 78 123 4567')).toBe('250781234567');
      });
      it('normalizes 0-prefixed 10-digit to 250', () => {
        expect(normalizeRwandaPhone('0781234567')).toBe('250781234567');
      });
      it('normalizes 9-digit to 250 prefix', () => {
        expect(normalizeRwandaPhone('781234567')).toBe('250781234567');
      });
      it('strips non-digits', () => {
        expect(normalizeRwandaPhone('+250 78-123-4567')).toBe('250781234567');
      });
    });
  });

  describe('phoneToAuthId', () => {
    it('appends @mobiflow.phone suffix to normalized phone', () => {
      expect(phoneToAuthId('0781234567')).toBe('250781234567@mobiflow.phone');
    });
    it('returns empty string for empty input', () => {
      expect(phoneToAuthId('')).toBe('');
    });
  });

  describe('normalizeAdminIdentifier', () => {
    it('returns empty string for empty/whitespace', () => {
      expect(normalizeAdminIdentifier('')).toBe('');
      expect(normalizeAdminIdentifier('   ')).toBe('');
    });
    it('lowercases email', () => {
      expect(normalizeAdminIdentifier('Admin@Example.COM')).toBe('admin@example.com');
    });
    it('normalizes phone to auth id when no @', () => {
      expect(normalizeAdminIdentifier('0781234567')).toBe('250781234567@mobiflow.phone');
    });
  });

  describe('validateAdminIdentifier', () => {
    describe('Errors', () => {
      it('returns error for empty input', () => {
        expect(validateAdminIdentifier('')).toContain('Enter');
        expect(validateAdminIdentifier('   ')).toContain('Enter');
      });
      it('returns error for invalid email', () => {
        expect(validateAdminIdentifier('a@')).toContain('valid email');
        expect(validateAdminIdentifier('user@')).toContain('valid email');
      });
    });
    describe('Valid input', () => {
      it('accepts valid email', () => {
        expect(validateAdminIdentifier('admin@example.com')).toBe(null);
      });
      it('validates phone when no @', () => {
        expect(validateAdminIdentifier('0781234567')).toBe(null);
        expect(validateAdminIdentifier('123')).toContain('Rwandan');
      });
    });
  });

  describe('validateRwandaPhone', () => {
    it('returns null for valid MTN/Airtel numbers', () => {
      expect(validateRwandaPhone('0781234567')).toBe(null);
      expect(validateRwandaPhone('0731234567')).toBe(null);
      expect(validateRwandaPhone('0721234567')).toBe(null);
      expect(validateRwandaPhone('0791234567')).toBe(null);
    });
    it('returns error for wrong length', () => {
      expect(validateRwandaPhone('078123')).toContain('valid Rwandan');
    });
    it('returns error for invalid prefix', () => {
      expect(validateRwandaPhone('0701234567')).toContain('072, 073, 078, or 079');
    });
  });

  describe('formatAdminLabel', () => {
    it('returns "Admin user" for null/undefined/empty', () => {
      expect(formatAdminLabel(null)).toBe('Admin user');
      expect(formatAdminLabel(undefined)).toBe('Admin user');
      expect(formatAdminLabel('')).toBe('Admin user');
    });
    it('returns email as-is when not phone auth id', () => {
      expect(formatAdminLabel('admin@example.com')).toBe('admin@example.com');
    });
    it('formats phone auth id as display number', () => {
      expect(formatAdminLabel('250781234567@mobiflow.phone')).toBe('078 123 4567');
    });
  });
});
