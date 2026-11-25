import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * QA tests for prisma7.config.ts (the Prisma CLI config that this change
 * reformatted).
 *
 * The config is the single place where the CLI learns the schema path and the
 * datasource URL, so the risk of a pure-formatting change here is that the
 * wiring silently breaks (or that a URL/credential gets hardcoded while
 * reformatting). Both are checked behaviourally: by loading the module with
 * different environments and by running the real `prisma` CLI.
 */
const repoRoot = fileURLToPath(new URL('..', import.meta.url));

interface PrismaConfigShape {
  schema?: string;
  migrations?: { path?: string };
  datasource?: { url?: string };
}

const originalDatabaseUrl = process.env.DATABASE_URL;
const originalDotenvPath = process.env.DOTENV_CONFIG_PATH;

// prisma7.config.ts imports `dotenv/config`, so a developer's local .env file
// could otherwise feed DATABASE_URL into these tests. Point dotenv at a path
// that does not exist so only the explicit environment is observed.
process.env.DOTENV_CONFIG_PATH = join(tmpdir(), 'qa-no-such-dotenv-file.env');

afterEach(() => {
  if (originalDotenvPath === undefined) {
    delete process.env.DOTENV_CONFIG_PATH;
  } else {
    process.env.DOTENV_CONFIG_PATH = originalDotenvPath;
  }
  if (originalDatabaseUrl === undefined) {
    delete process.env.DATABASE_URL;
  } else {
    process.env.DATABASE_URL = originalDatabaseUrl;
  }
  vi.resetModules();
});

const loadConfig = async (): Promise<PrismaConfigShape> => {
  vi.resetModules();
  const module = (await import('../prisma7.config.js')) as {
    default: PrismaConfigShape;
  };
  return module.default;
};

const envWithout = (...keys: string[]): Record<string, string> => {
  const env: Record<string, string> = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined && !keys.includes(key)) {
      env[key] = value;
    }
  }
  return env;
};

interface CliResult {
  status: number | null;
  output: string;
}

const runPrisma = (args: string[], env: Record<string, string>): CliResult => {
  const result = spawnSync('npx', ['prisma', ...args], {
    cwd: repoRoot,
    env,
    encoding: 'utf8',
    timeout: 120_000,
    maxBuffer: 16 * 1024 * 1024,
  });
  return {
    status: result.status,
    output: `${result.stdout ?? ''}${result.stderr ?? ''}`,
  };
};

describe('prisma7.config.ts', () => {
  it('reads the datasource URL from process.env.DATABASE_URL (no hardcoded URL)', async () => {
    const firstUrl = 'postgresql://qa-user:first-pass@qa-db-one:5432/qa_db_one';
    delete process.env.DATABASE_URL;
    process.env.DATABASE_URL = firstUrl;
    const firstConfig = await loadConfig();
    expect(firstConfig.datasource?.url).toBe(firstUrl);

    // A different environment must produce a different URL, otherwise the value
    // is baked into the file rather than taken from the environment.
    const secondUrl = 'postgres://qa-user:second-pass@qa-db-two:6543/qa_db_two';
    process.env.DATABASE_URL = secondUrl;
    const secondConfig = await loadConfig();
    expect(secondConfig.datasource?.url).toBe(secondUrl);
    expect(JSON.stringify(secondConfig)).not.toContain('first-pass');

    // No fallback/embedded connection string when the variable is absent.
    delete process.env.DATABASE_URL;
    const withoutUrl = await loadConfig();
    expect(withoutUrl.datasource?.url).toBeUndefined();
    expect(JSON.stringify(withoutUrl)).not.toMatch(/postgres(ql)?:\/\//);
  });

  it('points at an existing schema and migrations directory', async () => {
    delete process.env.DATABASE_URL;
    process.env.DATABASE_URL =
      'postgresql://qa-user:qa-pass@localhost:5432/qa_db';
    const config = await loadConfig();

    expect(config.schema).toBe('prisma/schema.prisma');
    expect(existsSync(join(repoRoot, config.schema as string))).toBe(true);

    expect(config.migrations?.path).toBe('prisma/migrations');
    expect(existsSync(join(repoRoot, config.migrations?.path as string))).toBe(
      true
    );
  });

  it('prisma CLI fails with a clear error instead of falling back when DATABASE_URL is unset', () => {
    const { status, output } = runPrisma(
      ['migrate', 'status'],
      envWithout('DATABASE_URL')
    );

    expect(status).not.toBe(0);
    expect(output).toMatch(/datasource\.url property is required|DATABASE_URL/);
    // no connection string may be smuggled in by the config file
    expect(output).not.toMatch(/postgres(ql)?:\/\//);
  });

  it('prisma CLI uses the DATABASE_URL from the environment', ctx => {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      ctx.skip();
      return;
    }

    const { output } = runPrisma(
      // read-only: reports migration state, never applies anything
      ['migrate', 'status'],
      envWithout()
    );

    if (
      /Can't reach database server|P1001|Authentication failed/i.test(output)
    ) {
      ctx.skip();
      return;
    }

    const parsed = new URL(databaseUrl);
    expect(output).toContain(parsed.hostname);
    expect(output).toContain(parsed.pathname.replace(/^\//, ''));
  }, 120_000);
});
