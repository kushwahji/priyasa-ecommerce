/**
 * Legacy database compatibility guard.
 *
 * Priyasa Store no longer owns a commerce database; Priyasa Core API is the
 * authoritative commerce backend. This surface exists only for retired Store
 * modules that are being removed or migrated. It never connects to a database.
 */

type LegacyRecord = Record<string, any>;

type LegacyModel = {
  [key: string]: any;
  (...args: any[]): Promise<LegacyRecord>;
  findMany<T = LegacyRecord>(...args: any[]): Promise<T[]>;
  findFirst<T = LegacyRecord>(...args: any[]): Promise<T | null>;
  findUnique<T = LegacyRecord>(...args: any[]): Promise<T | null>;
  findUniqueOrThrow<T = LegacyRecord>(...args: any[]): Promise<T>;
  findFirstOrThrow<T = LegacyRecord>(...args: any[]): Promise<T>;
  create<T = LegacyRecord>(...args: any[]): Promise<T>;
  createMany<T = LegacyRecord>(...args: any[]): Promise<T>;
  update<T = LegacyRecord>(...args: any[]): Promise<T>;
  updateMany<T = LegacyRecord>(...args: any[]): Promise<T>;
  upsert<T = LegacyRecord>(...args: any[]): Promise<T>;
  delete<T = LegacyRecord>(...args: any[]): Promise<T>;
  deleteMany<T = LegacyRecord>(...args: any[]): Promise<T>;
  count(...args: any[]): Promise<number>;
  aggregate<T = LegacyRecord>(...args: any[]): Promise<T>;
  groupBy<T = LegacyRecord>(...args: any[]): Promise<T[]>;
};

type LegacyDb = LegacyModel & {
  $transaction<T = LegacyRecord>(fn: (tx: LegacyModel) => Promise<T>): Promise<T>;
  $transaction<T = LegacyRecord>(queries: Promise<T>[]): Promise<T[]>;
  $queryRawUnsafe<T = LegacyRecord>(...args: any[]): Promise<T>;
  $executeRawUnsafe(...args: any[]): Promise<number>;
  $executeRaw(...args: any[]): Promise<number>;
};

const legacyDbCall = function legacyDbCall(): never {
  throw new Error('LEGACY_STORE_DATABASE_DISABLED: use Priyasa Core API');
};

const proxy = new Proxy(legacyDbCall as unknown as LegacyDb, {
  get() {
    return proxy;
  },
  apply() {
    return legacyDbCall();
  },
}) as LegacyDb;

export const db: LegacyDb = proxy;
