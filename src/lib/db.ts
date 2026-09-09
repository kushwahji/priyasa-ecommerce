import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@prisma/client';

declare global {
  // Reuse one Prisma instance across Next.js hot reloads and long-lived server runtimes.
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

function positiveInteger(value: string | undefined, fallback: number, minimum = 1) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= minimum ? parsed : fallback;
}

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) throw new Error('DATABASE_URL is required to initialize Prisma');

  const url = new URL(databaseUrl);
  const port = url.port ? Number(url.port) : 3306;
  if (!Number.isInteger(port) || port <= 0) throw new Error('DATABASE_URL contains an invalid database port');

  // Keep pool sizing configurable because the correct limit depends on the hosting
  // plan's MySQL/MariaDB max_connections and the number of app instances.
  // Defaults are deliberately moderate for shared hosting while allowing production
  // operators to increase capacity without changing application code.
  const connectionLimit = positiveInteger(process.env.PRISMA_CONNECTION_LIMIT, 10);
  const acquireTimeout = positiveInteger(process.env.PRISMA_ACQUIRE_TIMEOUT_MS, 20000);
  const connectTimeout = positiveInteger(process.env.PRISMA_CONNECT_TIMEOUT_MS, 5000);
  const idleTimeout = positiveInteger(process.env.PRISMA_IDLE_TIMEOUT_SECONDS, 300);

  const adapter = new PrismaMariaDb({
    host: url.hostname,
    port,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.replace(/^\//, '')),
    connectionLimit,
    acquireTimeout,
    connectTimeout,
    idleTimeout,
  });

  return new PrismaClient({ adapter });
}

// A single module-level instance prevents each request/module evaluation from
// creating a separate MariaDB connection pool. This is especially important in
// production runtimes where multiple routes share the same Node.js process.
export const db = globalThis.prisma ?? createPrismaClient();
globalThis.prisma = db;
