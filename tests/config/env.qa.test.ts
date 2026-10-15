import { afterAll, describe, expect, it, vi } from 'vitest';

/**
 * QA tests for src/config/env.ts.
 *
 * The module validates process.env at import time and calls process.exit(1) on
 * invalid configuration, so every test loads a fresh copy of the module with a
 * controlled environment and with process.exit mocked out (otherwise the whole
 * test worker would die).
 *
 * dotenv is mocked so a developer's local .env file can never make these tests
 * non-deterministic.
 */
const dotenvMock = vi.hoisted(() => ({ configCalls: 0 }));

vi.mock('dotenv', () => ({
  default: {
    config: () => {
      dotenvMock.configCalls += 1;
      return { parsed: {} };
    },
  },
}));

const VALID_DATABASE_URL = 'postgresql://user:password@localhost:5432/database';

const MANAGED_KEYS = ['PORT', 'NODE_ENV', 'DATABASE_URL'] as const;
type ManagedKey = (typeof MANAGED_KEYS)[number];
type EnvOverrides = Partial<Record<ManagedKey, string | undefined>>;

const originalEnv: Record<string, string | undefined> = {};
for (const key of MANAGED_KEYS) {
  originalEnv[key] = process.env[key];
}

afterAll(() => {
  for (const key of MANAGED_KEYS) {
    const value = originalEnv[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
});

class ProcessExitError extends Error {
  constructor(readonly code: number) {
    super(`process.exit(${code})`);
    this.name = 'ProcessExitError';
  }
}

interface LoadResult {
  module: typeof import('../../src/config/env.js') | null;
  exitCodes: number[];
  stderr: string[];
}

const loadEnvModule = async (overrides: EnvOverrides): Promise<LoadResult> => {
  for (const key of MANAGED_KEYS) {
    const value = overrides[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  vi.resetModules();

  const exitCodes: number[] = [];
  const stderr: string[] = [];

  const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((
    code?: number | string | null
  ) => {
    const numeric = typeof code === 'number' ? code : Number(code ?? 0);
    exitCodes.push(numeric);
    throw new ProcessExitError(numeric);
  }) as unknown as typeof process.exit);

  const errorSpy = vi
    .spyOn(console, 'error')
    .mockImplementation((...args: unknown[]) => {
      stderr.push(args.map(String).join(' '));
    });

  let module: LoadResult['module'] = null;
  try {
    module = await import('../../src/config/env.js');
  } catch (error) {
    if (!(error instanceof ProcessExitError)) {
      throw error;
    }
  } finally {
    exitSpy.mockRestore();
    errorSpy.mockRestore();
  }

  return { module, exitCodes, stderr };
};

describe('env config: import-time validation of process.env', () => {
  it('loads with a valid DATABASE_URL and defaults PORT/NODE_ENV', async () => {
    const { module, exitCodes } = await loadEnvModule({
      DATABASE_URL: VALID_DATABASE_URL,
    });

    expect(exitCodes).toEqual([]);
    expect(module?.PORT).toBe(3000);
    expect(module?.NODE_ENV).toBe('development');
    // .env is loaded through dotenv
    expect(dotenvMock.configCalls).toBeGreaterThan(0);
  });

  it('accepts a valid numeric PORT and a known NODE_ENV', async () => {
    const { module, exitCodes } = await loadEnvModule({
      PORT: '8080',
      NODE_ENV: 'production',
      DATABASE_URL: VALID_DATABASE_URL,
    });

    expect(exitCodes).toEqual([]);
    expect(module?.PORT).toBe(8080);
    expect(module?.NODE_ENV).toBe('production');
  });

  it('rejects a PORT with trailing garbage instead of silently truncating it', async () => {
    // parseInt('3000abc', 10) === 3000, so the server silently binds port 3000
    const { exitCodes } = await loadEnvModule({
      PORT: '3000abc',
      NODE_ENV: 'test',
      DATABASE_URL: VALID_DATABASE_URL,
    });

    expect(exitCodes).toEqual([1]);
  });

  it('rejects an out-of-range PORT instead of crashing later with RangeError', async () => {
    // PORT=70000 is "numeric" but not a valid TCP port: app.listen() then
    // throws ERR_SOCKET_BAD_PORT instead of a clear config error
    const { exitCodes } = await loadEnvModule({
      PORT: '70000',
      NODE_ENV: 'test',
      DATABASE_URL: VALID_DATABASE_URL,
    });

    expect(exitCodes).toEqual([1]);
  });

  it('fails fast when DATABASE_URL is missing', async () => {
    const { module, exitCodes, stderr } = await loadEnvModule({
      PORT: '3000',
      NODE_ENV: 'test',
    });

    expect(exitCodes).toEqual([1]);
    expect(stderr.join('\n')).toMatch(/DATABASE_URL is required/);
    expect(module).toBeNull();
  });

  it('fails fast when DATABASE_URL is not a postgres url', async () => {
    const { module, exitCodes, stderr } = await loadEnvModule({
      PORT: '3000',
      NODE_ENV: 'test',
      DATABASE_URL: 'mysql://user:password@localhost:3306/database',
    });

    expect(exitCodes).toEqual([1]);
    expect(stderr.join('\n')).toMatch(/postgres:\/\/.*postgresql:\/\//);
    expect(module).toBeNull();
  });
});

describe('validateDatabaseUrl', () => {
  it('rejects missing, padded and near-miss urls and keeps valid ones unchanged', async () => {
    const { module } = await loadEnvModule({
      DATABASE_URL: VALID_DATABASE_URL,
    });
    if (!module) {
      throw new Error('expected src/config/env.ts to load with a valid env');
    }
    const { validateDatabaseUrl } = module;

    expect(() => validateDatabaseUrl(undefined)).toThrow(
      /DATABASE_URL is required/
    );
    expect(() => validateDatabaseUrl('')).toThrow(/DATABASE_URL is required/);
    // padding or a scheme embedded in the middle must not pass the prefix check
    expect(() => validateDatabaseUrl(' postgresql://user@host/db')).toThrow();
    expect(() => validateDatabaseUrl('xpostgres://user@host/db')).toThrow();
    expect(validateDatabaseUrl(VALID_DATABASE_URL)).toBe(VALID_DATABASE_URL);
  });
});
