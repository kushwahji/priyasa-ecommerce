import { readFile, writeFile } from 'node:fs/promises';

const sourcePath = 'prisma/schema.prisma';
const mysqlPath = 'prisma/schema.mysql.prisma';

const source = await readFile(sourcePath, 'utf8');
const mysqlSchema = source
  .replace(/provider\s*=\s*"postgresql"/, 'provider = "mysql"')
  .replace(/\n\s*url\s*=\s*env\("DATABASE_URL"\)/, '');

if (!/provider\s*=\s*"mysql"/.test(mysqlSchema)) {
  throw new Error('Could not prepare the MySQL Prisma schema from prisma/schema.prisma');
}

await writeFile(mysqlPath, mysqlSchema, 'utf8');
console.log(`Prepared ${mysqlPath} without a datasource URL; Prisma reads DATABASE_URL from prisma.config.ts.`);
