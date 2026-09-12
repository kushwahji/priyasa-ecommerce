/**
 * Local commerce persistence has been retired.
 *
 * Priyasa Core API is the single source of truth for catalog, customer,
 * cart, inventory, checkout, orders, payments, shipping and CMS data.
 *
 * The typed compatibility surface below exists only so legacy server modules
 * can be retired incrementally without re-introducing Prisma or a second DB.
 * Every operation fails fast at runtime and must be migrated to Core API.
 */
export type DbRow = Record<string, any>;

export interface LocalDbTable {
  findMany<T extends DbRow = DbRow>(..._args: any[]): Promise<T[]>;
  findFirst<T extends DbRow = DbRow>(..._args: any[]): Promise<T | null>;
  findUnique<T extends DbRow = DbRow>(..._args: any[]): Promise<T | null>;
  findUniqueOrThrow<T extends DbRow = DbRow>(..._args: any[]): Promise<T>;
  create<T extends DbRow = DbRow>(..._args: any[]): Promise<T>;
  createMany<T extends DbRow = DbRow>(..._args: any[]): Promise<T>;
  update<T extends DbRow = DbRow>(..._args: any[]): Promise<T>;
  updateMany<T extends DbRow = DbRow>(..._args: any[]): Promise<T>;
  upsert<T extends DbRow = DbRow>(..._args: any[]): Promise<T>;
  delete<T extends DbRow = DbRow>(..._args: any[]): Promise<T>;
  deleteMany<T extends DbRow = DbRow>(..._args: any[]): Promise<T>;
  count<T extends number = number>(..._args: any[]): Promise<T>;
  aggregate<T extends DbRow = DbRow>(..._args: any[]): Promise<T>;
  groupBy<T extends DbRow = DbRow>(..._args: any[]): Promise<T[]>;
}

export interface LocalDb {
  [model: string]: LocalDbTable | ((...args: any[]) => Promise<any>) | undefined;
  $transaction<T>(fn: (tx: LocalDb) => Promise<T>): Promise<T>;
  $transaction<T extends Promise<any>[]>(queries: T): Promise<any[]>;
  $queryRaw<T = DbRow[]>(...args: any[]): Promise<T>;
  $executeRaw<T = number>(...args: any[]): Promise<T>;
  $executeRawUnsafe<T = number>(...args: any[]): Promise<T>;
}

const disabledOperation = (label: string) => (..._args: any[]): never => {
  throw new Error(`LOCAL_DATABASE_DISABLED: ${label} must use Priyasa Core API`);
};

const disabledTable = (model: string): LocalDbTable => {
  const operation = disabledOperation(`db.${model}`);
  return {
    findMany: operation as LocalDbTable['findMany'],
    findFirst: operation as LocalDbTable['findFirst'],
    findUnique: operation as LocalDbTable['findUnique'],
    findUniqueOrThrow: operation as LocalDbTable['findUniqueOrThrow'],
    create: operation as LocalDbTable['create'],
    createMany: operation as LocalDbTable['createMany'],
    update: operation as LocalDbTable['update'],
    updateMany: operation as LocalDbTable['updateMany'],
    upsert: operation as LocalDbTable['upsert'],
    delete: operation as LocalDbTable['delete'],
    deleteMany: operation as LocalDbTable['deleteMany'],
    count: operation as LocalDbTable['count'],
    aggregate: operation as LocalDbTable['aggregate'],
    groupBy: operation as LocalDbTable['groupBy'],
  };
};

const disabledDb = new Proxy({} as LocalDb, {
  get(_target, property: string | symbol) {
    const name = String(property);
    if (name === 'then') return undefined;
    if (name === '$transaction' || name === '$queryRaw' || name === '$executeRaw' || name === '$executeRawUnsafe') {
      return disabledOperation(`db.${name}`);
    }
    return disabledTable(name);
  },
});

export const db: LocalDb = disabledDb;
