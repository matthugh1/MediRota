import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedTrustsAndHospitals() {
  console.log('🌱 Seeding Trusts and Hospitals...');

  try {
    // Create Trusts
    const trust1 = await prisma.trust.upsert({
      where: { name: 'NHS Greater Manchester' },
      update: {},
      create: {
        name: 'NHS Greater Manchester',
      },
    });

    const trust2 = await prisma.trust.upsert({
      where: { name: 'NHS London' },
      update: {},
      create: {
        name: 'NHS London',
      },
    });

    const trust3 = await prisma.trust.upsert({
      where: { name: 'NHS Birmingham' },
      update: {},
      create: {
        name: 'NHS Birmingham',
      },
    });

    console.log('✅ Trusts created:', [trust1.name, trust2.name, trust3.name]);

    // Create Hospitals for each Trust
    const hospitals = await Promise.all([
      // NHS Greater Manchester Hospitals
      prisma.hospital.upsert({
        where: { trustId_name: { trustId: trust1.id, name: 'Manchester Royal Infirmary' } },
        update: {},
        create: {
          name: 'Manchester Royal Infirmary',
          trustId: trust1.id,
        },
      }),
      prisma.hospital.upsert({
        where: { trustId_name: { trustId: trust1.id, name: 'Salford Royal Hospital' } },
        update: {},
        create: {
          name: 'Salford Royal Hospital',
          trustId: trust1.id,
        },
      }),

      // NHS London Hospitals
      prisma.hospital.upsert({
        where: { trustId_name: { trustId: trust2.id, name: 'Guy\'s and St Thomas\' Hospital' } },
        update: {},
        create: {
          name: 'Guy\'s and St Thomas\' Hospital',
          trustId: trust2.id,
        },
      }),
      prisma.hospital.upsert({
        where: { trustId_name: { trustId: trust2.id, name: 'King\'s College Hospital' } },
        update: {},
        create: {
          name: 'King\'s College Hospital',
          trustId: trust2.id,
        },
      }),

      // NHS Birmingham Hospitals
      prisma.hospital.upsert({
        where: { trustId_name: { trustId: trust3.id, name: 'Queen Elizabeth Hospital Birmingham' } },
        update: {},
        create: {
          name: 'Queen Elizabeth Hospital Birmingham',
          trustId: trust3.id,
        },
      }),
      prisma.hospital.upsert({
        where: { trustId_name: { trustId: trust3.id, name: 'Birmingham Children\'s Hospital' } },
        update: {},
        create: {
          name: 'Birmingham Children\'s Hospital',
          trustId: trust3.id,
        },
      }),
    ]);

    console.log('✅ Hospitals created:', hospitals.map(h => h.name));

    console.log('🎉 Trusts and Hospitals seeding completed!');
  } catch (error) {
    console.error('❌ Error seeding Trusts and Hospitals:', error);
    throw error;
  }
}

// Run the seeding
seedTrustsAndHospitals()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
