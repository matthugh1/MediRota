#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting test seed...');

  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connection successful');

    // Create a test trust
    const trust = await prisma.trust.create({
      data: {
        name: 'Test Trust'
      }
    });
    console.log('✅ Created trust:', trust.name);

    // Create a test hospital
    const hospital = await prisma.hospital.create({
      data: {
        name: 'Test Hospital',
        trustId: trust.id
      }
    });
    console.log('✅ Created hospital:', hospital.name);

    console.log('✅ Test seed completed successfully!');
  } catch (error) {
    console.error('❌ Error in test seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
