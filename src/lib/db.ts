/**
 * Legacy database compatibility guard.
 *
 * Priyasa Store no longer owns a commerce database; Priyasa Core API is the
 * authoritative commerce backend. A small typed compatibility surface remains
 * only so retired Store-side modules can be compiled safely while their
 * endpoints are removed or migrated to Core. Every runtime call fails closed.
 */

type LegacyModel = {
  [key: string]: LegacyModel;
  findMany<T = any>(...args: any[]): Promise<T[]>;
  findFirst<T = any>(...args: any[]): Promise<T | null>;
  findUnique<T = any>(...args: any[]): Promise<T | null>;
  findUniqueOrThrow<T = any>(...args: any[]): Promise<T>;
  findFirstOrThrow<T = any>(...args: any[]): Promise<T>;
  create<T = any>(...args: any[]): Promise<T>;
  createMany<T = any>(...args: any[]): Promise<T>;
  update<T = any>(...args: any[]): Promise<T>;
  updateMany<T = any>(...args: any[]): Promise<T>;
  upsert<T = any>(...args: any[]): Promise<T>;
  delete<T = any>(...args: any[]): Promise<T>;
  deleteMany<T = any>(...args: any[]): Promise<T>;
  count<T = number>(...args: any[]): Promise<T>;
  aggregate<T = any>(...args: any[]): Promise<T>;
  groupBy<T = any>(...args: any[]): Promise<T[]>;
};

type LegacyDb = LegacyModel & {
  $transaction<T>(fn: (tx: LegacyModel) => Promise<T>): Promise<T>;
  $transaction<T = any>(queries: Promise<T>[]): Promise<T[]>;
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
