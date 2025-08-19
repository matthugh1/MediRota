#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearDatabase() {
  console.log('🗑️  Clearing database...');
  
  try {
    // Get all application table names (exclude prisma migrations and system tables)
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename NOT LIKE 'pg_%'
        AND tablename NOT LIKE '_prisma_%'
    `;

    const tableNames = tables.map(t => t.tablename).filter(Boolean);
    console.log(`Found ${tableNames.length} tables to clear`);

    if (tableNames.length === 0) {
      console.log('Nothing to clear.');
    } else {
      const list = tableNames.map(n => `"${n}"`).join(', ');
      console.log(`  Truncating: ${tableNames.join(', ')}`);
      // Use TRUNCATE with CASCADE to respect FK dependencies
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${list} CASCADE;`);
      console.log('✅ Database cleared successfully');
    }
    
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Always run
clearDatabase()
  .then(() => {
    console.log('🎉 Database clearing completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Database clearing failed:', error);
    process.exit(1);
  });

export { clearDatabase };
