import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { get as httpGet } from 'node:http';
import { createServer } from 'node:net';
import { dirname, join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

/**
 * QA tests for the npm script gates (package.json) and the real built output.
 *
 * These guard the milestone's "Done when" criteria that the in-process unit
 * tests cannot see:
 *   - typecheck/build must work on a fresh checkout before `prisma generate`
 *     has ever been run (regression test for the missing Prisma client),
 *   - the built server must boot and serve GET /health,
 *   - an invalid PORT must fail fast with a clear message,
 *   - `npm run lint` and `npm run format:check` must exit 0.
 */
const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const VALID_DATABASE_URL =
  'postgresql://user:password@localhost:5432/qa_test_db';

type Env = Record<string, string | undefined>;

interface RunResult {
  status: number | null;
  stdout: string;
  stderr: string;
}

const runSync = (
  command: string,
  args: string[],
  options: { cwd: string; env?: Env; timeout?: number }
): RunResult => {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    env: { ...process.env, ...options.env },
    encoding: 'utf8',
    timeout: options.timeout ?? 240_000,
    maxBuffer: 32 * 1024 * 1024,
  });
  return {
    status: result.status,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
};

interface HttpResult {
  status: number;
  contentType: string;
  body: string;
}

const httpGetJson = (url: string): Promise<HttpResult> =>
  new Promise((resolve, reject) => {
    const request = httpGet(url, response => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', chunk => {
        body += chunk;
      });
      response.on('end', () =>
        resolve({
          status: response.statusCode ?? 0,
          contentType: String(response.headers['content-type'] ?? ''),
          body,
        })
      );
    });
    request.on('error', reject);
    request.setTimeout(2_000, () => request.destroy(new Error('http timeout')));
  });

const getFreePort = async (): Promise<number> => {
  const server = createServer();
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  await new Promise<void>((resolve, reject) => {
    server.close(error => (error ? reject(error) : resolve()));
  });
  return port;
};

let freshCheckoutDir = '';

beforeAll(() => {
  // Put the throwaway copy next to the repo (same filesystem, so hardlinks and
  // the executable node_modules/.bin entries work), falling back to a dot-dir
  // inside the repo only if the parent directory is not writable.
  let tempDir: string;
  try {
    tempDir = mkdtempSync(join(dirname(repoRoot), 'qa-fresh-'));
  } catch {
    tempDir = mkdtempSync(join(repoRoot, '.qa-fresh-'));
  }
  freshCheckoutDir = tempDir;

  // A full node_modules is expensive to recreate. Hardlinks share the existing
  // files on disk, so this is fast and never modifies the original files.
  const linkResult = spawnSync(
    'cp',
    [
      '-al',
      join(repoRoot, 'node_modules'),
      join(freshCheckoutDir, 'node_modules'),
    ],
    { encoding: 'utf8' }
  );
  if (linkResult.status !== 0) {
    throw new Error(
      `failed to hardlink node_modules into ${freshCheckoutDir}: ${linkResult.stderr}`
    );
  }

  // The generated Prisma client lives in node_modules/.prisma and is not in
  // git. Removing it from the copy makes this a faithful "fresh checkout" where
  // the client has never been generated.
  rmSync(join(freshCheckoutDir, 'node_modules', '.prisma'), {
    recursive: true,
    force: true,
  });

  const copyResult = spawnSync(
    'cp',
    [
      '-r',
      'package.json',
      'tsconfig.json',
      'tsconfig.test.json',
      'prisma7.config.ts',
      'src',
      'prisma',
      freshCheckoutDir,
    ],
    { cwd: repoRoot, encoding: 'utf8' }
  );
  if (copyResult.status !== 0) {
    throw new Error(`failed to copy project files: ${copyResult.stderr}`);
  }
  if (!existsSync(join(freshCheckoutDir, 'package.json'))) {
    throw new Error('fresh checkout copy is missing package.json');
  }
});

afterAll(() => {
  if (freshCheckoutDir) {
    rmSync(freshCheckoutDir, { recursive: true, force: true });
  }
});

const buildOrThrow = (): void => {
  if (existsSync(join(freshCheckoutDir, 'dist', 'server.js'))) {
    return;
  }
  const result = runSync('npm', ['run', 'build'], { cwd: freshCheckoutDir });
  if (result.status !== 0) {
    throw new Error(`npm run build failed: ${result.stdout}${result.stderr}`);
  }
};

describe('npm script gates on a fresh checkout', () => {
  it('typecheck and build generate the Prisma client and compile without a pre-generated client', () => {
    const tscBin = join(freshCheckoutDir, 'node_modules', '.bin', 'tsc');

    // Sanity check: before generation the copy really is in the broken state
    // that motivated the bug, so plain tsc must fail there.
    const before = runSync(tscBin, ['--noEmit'], { cwd: freshCheckoutDir });
    expect(before.status).not.toBe(0);

    const typecheck = runSync('npm', ['run', 'typecheck'], {
      cwd: freshCheckoutDir,
    });
    expect(typecheck.status, typecheck.stdout + typecheck.stderr).toBe(0);

    const build = runSync('npm', ['run', 'build'], {
      cwd: freshCheckoutDir,
    });
    expect(build.status, build.stdout + build.stderr).toBe(0);
    expect(existsSync(join(freshCheckoutDir, 'dist', 'server.js'))).toBe(true);

    // The build output must be able to import the generated Prisma client.
    const importCheck = runSync(
      'node',
      [
        '-e',
        "import('./dist/db/prisma.js').then(() => console.log('prisma-ok'))",
      ],
      {
        cwd: freshCheckoutDir,
        env: { DATABASE_URL: VALID_DATABASE_URL },
      }
    );
    expect(importCheck.status, importCheck.stdout + importCheck.stderr).toBe(0);
    expect(importCheck.stdout).toContain('prisma-ok');
  }, 240_000);
});

describe('real server process', () => {
  it('built server serves GET /health over HTTP on a free PORT', async () => {
    buildOrThrow();
    const port = await getFreePort();
    const child = spawn('node', ['dist/server.js'], {
      cwd: freshCheckoutDir,
      env: {
        ...process.env,
        PORT: String(port),
        NODE_ENV: 'test',
        DATABASE_URL: VALID_DATABASE_URL,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    try {
      let response: HttpResult | null = null;
      let lastError: unknown = null;
      for (let attempt = 0; attempt < 50; attempt += 1) {
        try {
          response = await httpGetJson(`http://127.0.0.1:${port}/health`);
          break;
        } catch (error) {
          lastError = error;
          await delay(100);
        }
      }
      if (!response) {
        throw new Error(`server did not become ready: ${String(lastError)}`);
      }

      expect(response.status).toBe(200);
      expect(response.contentType).toMatch(/^application\/json/);
      expect(JSON.parse(response.body)).toEqual({ status: 'ok' });
    } finally {
      child.kill('SIGTERM');
    }
  }, 240_000);

  it('invalid PORT fails fast with a clear message (real process)', () => {
    buildOrThrow();
    for (const badPort of ['abc', '70000', '0', ' 3000']) {
      const result = runSync('node', ['dist/server.js'], {
        cwd: freshCheckoutDir,
        env: {
          PORT: badPort,
          NODE_ENV: 'test',
          DATABASE_URL: VALID_DATABASE_URL,
        },
      });
      expect(result.status, `PORT=${badPort}`).toBe(1);
      expect(result.stderr, `PORT=${badPort}`).toMatch(/Invalid PORT/);
    }
  }, 240_000);
});

describe('npm script gates in the repository', () => {
  it('npm run lint exits 0 with no problems', () => {
    const result = runSync('npm', ['run', 'lint'], { cwd: repoRoot });
    expect(result.status, result.stdout + result.stderr).toBe(0);
  }, 240_000);

  // BUG: `npm run format:check` (prettier --check .) fails on files added by
  // this change: package.json, prisma7.config.ts, src/config/env.ts,
  // src/db/prisma.ts and tests/config/env.test.ts.
  it.fails(
    'npm run format:check exits 0',
    () => {
      const result = runSync('npm', ['run', 'format:check'], { cwd: repoRoot });
      expect(result.status, result.stdout + result.stderr).toBe(0);
    },
    240_000
  );
});
