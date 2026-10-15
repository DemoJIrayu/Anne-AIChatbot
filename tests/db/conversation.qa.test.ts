import { setTimeout as delay } from 'node:timers/promises';
import { afterAll, describe, expect, it } from 'vitest';

/**
 * Integration tests for the `Conversation` model / migration
 * (src/db/prisma.ts + prisma/schema.prisma).
 *
 * Skipped cleanly when DATABASE_URL is not set, when the database is not
 * reachable, or when the Prisma client has not been generated yet.
 */
type PrismaModule = typeof import('../../src/db/prisma.js');

const databaseUrl = process.env.DATABASE_URL;
const platformPrefix = `qa-env-${Date.now()}`;

let prisma: PrismaModule['default'] | null = null;
let skipReason = 'DATABASE_URL is not set';

if (databaseUrl) {
  skipReason = '';
  try {
    const module = await import('../../src/db/prisma.js');
    prisma = module.default;
    const [{ exists }] = await prisma.$queryRaw<{ exists: boolean }[]>`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'Conversation'
      ) AS exists
    `;
    if (!exists) {
      prisma = null;
      skipReason =
        'table "Conversation" does not exist (migration not applied)';
    }
  } catch (error) {
    prisma = null;
    skipReason = `database not reachable: ${
      error instanceof Error ? error.message : String(error)
    }`;
  }
}

if (!prisma) {
  console.warn(`[conversation.qa] skipping database tests: ${skipReason}`);
}

const describeDb = prisma ? describe : describe.skip;

const client = (): PrismaModule['default'] => {
  if (!prisma) {
    throw new Error('prisma client is not initialised');
  }
  return prisma;
};

afterAll(async () => {
  if (!prisma) {
    return;
  }
  await prisma.conversation.deleteMany({
    where: { platform: { startsWith: platformPrefix } },
  });
  await prisma.$disconnect();
});

describeDb('Conversation model (integration, DATABASE_URL)', () => {
  it('persists a conversation with generated id and timestamps', async () => {
    const created = await client().conversation.create({
      data: { platform: `${platformPrefix}-fb`, externalUserId: 'user-1' },
    });

    expect(typeof created.id).toBe('string');
    expect(created.id.length).toBeGreaterThan(0);
    expect(created.platform).toBe(`${platformPrefix}-fb`);
    expect(created.externalUserId).toBe('user-1');
    expect(created.createdAt).toBeInstanceOf(Date);
    expect(created.updatedAt).toBeInstanceOf(Date);

    const found = await client().conversation.findUnique({
      where: { id: created.id },
    });
    expect(found?.externalUserId).toBe('user-1');
  });

  it('enforces the unique (platform, externalUserId) index', async () => {
    const platform = `${platformPrefix}-line`;
    const data = { platform, externalUserId: 'dup-user' };

    await client().conversation.create({ data });
    await expect(client().conversation.create({ data })).rejects.toMatchObject({
      code: 'P2002',
    });

    const count = await client().conversation.count({ where: data });
    expect(count).toBe(1);
  });

  it('allows the same externalUserId on a different platform', async () => {
    const externalUserId = 'shared-user';
    const first = await client().conversation.create({
      data: { platform: `${platformPrefix}-fb`, externalUserId },
    });
    const second = await client().conversation.create({
      data: { platform: `${platformPrefix}-line`, externalUserId },
    });

    expect(second.id).not.toBe(first.id);
    const count = await client().conversation.count({
      where: { externalUserId, platform: { startsWith: platformPrefix } },
    });
    expect(count).toBeGreaterThanOrEqual(2);
  });

  it('touches updatedAt on update but keeps createdAt', async () => {
    const created = await client().conversation.create({
      data: { platform: `${platformPrefix}-fb`, externalUserId: 'before' },
    });

    // TIMESTAMP(3) column: wait long enough for a distinguishable timestamp
    await delay(20);

    const updated = await client().conversation.update({
      where: { id: created.id },
      data: { externalUserId: 'after' },
    });

    expect(updated.createdAt.getTime()).toBe(created.createdAt.getTime());
    expect(updated.updatedAt.getTime()).toBeGreaterThan(
      created.updatedAt.getTime()
    );
    expect(updated.externalUserId).toBe('after');
  });
});
