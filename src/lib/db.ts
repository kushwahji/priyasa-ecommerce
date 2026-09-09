import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@prisma/client';

declare global { var prisma: PrismaClient | undefined }

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) throw new Error('DATABASE_URL is required to initialize Prisma');

  const url = new URL(databaseUrl);
  const port = url.port ? Number(url.port) : 3306;
  if (!Number.isInteger(port) || port <= 0) throw new Error('DATABASE_URL contains an invalid database port');

  const adapter = new PrismaMariaDb({
    host: url.hostname,
    port,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.replace(/^\//, '')),
    connectionLimit: 10,
    connectTimeout: 5000,
    idleTimeout: 300,
  });

  return new PrismaClient({ adapter });
}

export const db = globalThis.prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== 'production') globalThis.prisma = db;
