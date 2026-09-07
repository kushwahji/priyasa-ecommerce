import { readFile, writeFile } from 'node:fs/promises';

const sourcePath = 'prisma/schema.prisma';
const mysqlPath = 'prisma/schema.mysql.prisma';

const source = await readFile(sourcePath, 'utf8');
const mysqlSchema = source.replace(
  /provider\s*=\s*"postgresql"/,
  'provider = "mysql"',
);

if (mysqlSchema === source) {
  if (!/provider\s*=\s*"mysql"/.test(source)) {
    throw new Error('Could not find a Prisma SQL provider in prisma/schema.prisma');
  }
}

await writeFile(mysqlPath, mysqlSchema, 'utf8');
console.log(`Prepared ${mysqlPath} for the current Hostinger/MySQL deployment.`);
