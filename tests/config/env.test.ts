import { describe, it, expect } from 'vitest';
import { validateDatabaseUrl } from '../../src/config/env';

describe('Environment Configuration', () => {
  describe('validateDatabaseUrl', () => {
    it('should throw error when DATABASE_URL is missing', () => {
      expect(() => validateDatabaseUrl(undefined)).toThrow('DATABASE_URL is required but was not provided.');
    });

    it('should throw error when DATABASE_URL does not start with postgres:// or postgresql://', () => {
      expect(() => validateDatabaseUrl('mysql://user:password@localhost:3306/database')).toThrow('DATABASE_URL must start with "postgres://" or "postgresql://".');
    });

    it('should accept valid DATABASE_URL starting with postgres://', () => {
      const result = validateDatabaseUrl('postgres://user:password@localhost:5432/database');
      expect(result).toBe('postgres://user:password@localhost:5432/database');
    });

    it('should accept valid DATABASE_URL starting with postgresql://', () => {
      const result = validateDatabaseUrl('postgresql://user:password@localhost:5432/database');
      expect(result).toBe('postgresql://user:password@localhost:5432/database');
    });
  });
});