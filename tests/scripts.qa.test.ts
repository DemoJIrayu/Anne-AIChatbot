import { spawn, spawnSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { get as httpGet } from 'node:http';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
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
 *   - the Prettier gate is scoped by .prettierignore: generated/protected paths
 *     (dist/, node_modules/, .github/) are skipped, while src/, tests/ and the
 *     config files must still be checked, so the gate cannot be "fixed" by
 *     ignoring the code it is supposed to protect.
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

  it('npm run format:check exits 0', () => {
    const result = runSync('npm', ['run', 'format:check'], { cwd: repoRoot });
    expect(result.status, result.stdout + result.stderr).toBe(0);
  }, 240_000);
});

const prettierBin = join(repoRoot, 'node_modules', '.bin', 'prettier');
const prettierIgnoreFile = join(repoRoot, '.prettierignore');

// Hand-written code/config that must keep being format-checked.
const FORMAT_CHECKED_PATHS = [
  'src/app.ts',
  'src/config/env.ts',
  'src/db/prisma.ts',
  'tests/config/env.test.ts',
  'tests/scripts.qa.test.ts',
  'prisma7.config.ts',
  'package.json',
  'tsconfig.json',
  'eslint.config.mjs',
];

// Generated or protected paths this change deliberately excluded.
const FORMAT_IGNORED_PATHS = [
  '.github/workflows/devsecops.yml',
  '.github/dependabot.yml',
  'dist/server.js',
  'dist/nested/app.ts',
  'node_modules/prettier/index.cjs',
];

describe('prettier format gate scope (.prettierignore)', () => {
  it('ignores only generated/protected paths, never src/, tests/ or the configs', async () => {
    const { getFileInfo } = await import('prettier');

    for (const relativePath of FORMAT_CHECKED_PATHS) {
      const info = await getFileInfo(join(repoRoot, relativePath), {
        ignorePath: [prettierIgnoreFile],
      });
      expect(info.ignored, `${relativePath} must stay format-checked`).toBe(
        false
      );
    }

    for (const relativePath of FORMAT_IGNORED_PATHS) {
      const info = await getFileInfo(join(repoRoot, relativePath), {
        ignorePath: [prettierIgnoreFile],
      });
      expect(info.ignored, `${relativePath} should be ignored`).toBe(true);
    }
  });

  it('still fails on unformatted src/tests code while skipping dist/ and .github/', () => {
    // A throwaway copy of the repository (no node_modules) so a deliberately
    // misformatted file can be introduced without touching the real tree.
    const workDir = mkdtempSync(join(tmpdir(), 'qa-format-gate-'));
    try {
      for (const entry of [
        '.prettierrc',
        '.prettierignore',
        'eslint.config.mjs',
        'prisma7.config.ts',
        'tsconfig.json',
        'tsconfig.test.json',
        'package.json',
        'prisma',
        'src',
        'tests',
        '.github',
      ]) {
        cpSync(join(repoRoot, entry), join(workDir, entry), {
          recursive: true,
        });
      }

      const checkAll = () =>
        runSync(prettierBin, ['--check', '.'], {
          cwd: workDir,
          timeout: 120_000,
        });

      const baseline = checkAll();
      expect(baseline.status, baseline.stdout + baseline.stderr).toBe(0);

      // Ignored trees may contain arbitrarily bad formatting: this repository's
      // .github/ files are not Prettier-clean, and neither is this generated
      // dist/ output, yet the gate must stay green.
      mkdirSync(join(workDir, 'dist'), { recursive: true });
      writeFileSync(
        join(workDir, 'dist', 'server.js'),
        'const generated={a:1,b:[1,2,3]};\n'
      );
      mkdirSync(join(workDir, '.github', 'workflows'), { recursive: true });
      writeFileSync(
        join(workDir, '.github', 'workflows', 'qa.yml'),
        'name:   qa\non: push\njobs:  {}\n'
      );

      const ignoredOnly = checkAll();
      expect(ignoredOnly.status, ignoredOnly.stdout + ignoredOnly.stderr).toBe(
        0
      );

      // Real source code must not escape the gate.
      writeFileSync(
        join(workDir, 'src', 'qa_unformatted.ts'),
        'const qaValue={a:1,b:[1,2,3]};\nexport default qaValue;\n'
      );

      const drift = checkAll();
      const driftOutput = drift.stdout + drift.stderr;
      expect(drift.status).not.toBe(0);
      expect(driftOutput).toContain('qa_unformatted.ts');
      expect(driftOutput).not.toContain('qa.yml');
      expect(driftOutput).not.toContain('dist/server.js');
    } finally {
      rmSync(workDir, { recursive: true, force: true });
    }
  }, 240_000);

  it('the files changed by this pull request are Prettier-clean', () => {
    const changedFiles = [
      'prisma7.config.ts',
      'src/config/env.ts',
      'src/db/prisma.ts',
      'tests/config/env.test.ts',
      'tests/scripts.qa.test.ts',
    ];
    const result = runSync(prettierBin, ['--check', ...changedFiles], {
      cwd: repoRoot,
      timeout: 120_000,
    });
    expect(result.status, result.stdout + result.stderr).toBe(0);
  }, 240_000);
});
