import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { hashPassword } from '../src/services/password';

const prisma = new PrismaClient();

// Brands data (from BrandsPage.tsx)
const brandsData = [
  {
    name: 'PROTTI',
    image: '/images/brands/PROTTI.png',
    description: 'Máquinas industriales italianas de alta precisión',
    specialties: [
      'Máquinas de coser industriales',
      'Equipos de alta velocidad',
      'Tecnología italiana',
    ],
  },
  {
    name: 'SHIMA SEIKI',
    image: '/images/brands/SHIMA SEIKI.png',
    description: 'Líder mundial en máquinas de tejido japonesas',
    specialties: [
      'Máquinas de tejido',
      'Tecnología japonesa',
      'Automatización avanzada',
    ],
  },
  {
    name: 'Steiger ZAMARK',
    image: '/images/brands/Steiger ZAMARK.png',
    description: 'Tecnología de costura avanzada y soluciones industriales',
    specialties: [
      'Costura industrial',
      'Soluciones automatizadas',
      'Equipos especializados',
    ],
  },
  {
    name: 'STOLL',
    image: '/images/brands/STOLL.png',
    description: 'Máquinas de punto alemanas de última generación',
    specialties: [
      'Máquinas de punto',
      'Tecnología alemana',
      'Sistemas CAD/CAM',
    ],
  },
  {
    name: 'Scheller',
    image: '/images/brands/Scheller.png',
    description: 'Maquinaria textil europea para tejido de punto y confección',
    specialties: [
      'Tejido de punto',
      'Confección industrial',
      'Ingeniería europea',
    ],
  },
];

/**
 * Creates or updates the admin account from ADMIN_EMAIL and ADMIN_PASSWORD.
 * This replaces the public /api/auth/register endpoint, which allowed anyone
 * to grant themselves admin access on a deployed API. Re-running the seed with
 * a new ADMIN_PASSWORD doubles as a password reset.
 */
async function seedAdminUser() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.log('  ⚠ ADMIN_EMAIL / ADMIN_PASSWORD not set, skipping admin user');
    return;
  }

  if (password.length < 12) {
    throw new Error('ADMIN_PASSWORD must be at least 12 characters');
  }

  const passwordHash = await hashPassword(password);

  await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: 'ADMIN', active: true },
    create: { email, passwordHash, role: 'ADMIN', active: true },
  });

  console.log(`  ✓ Admin user ready: ${email}`);
}

async function main() {
  console.log('🌱 Starting database seed...');

  console.log('🔐 Seeding admin user...');
  await seedAdminUser();

  // Seed Brands
  console.log('📦 Seeding brands...');
  const brandMap = new Map<string, string>();

  for (const brandData of brandsData) {
    const brand = await prisma.brand.upsert({
      where: { name: brandData.name },
      update: {
        image: brandData.image,
        description: brandData.description,
        specialties: brandData.specialties,
      },
      create: brandData,
    });
    brandMap.set(brandData.name, brand.id);
    console.log(`  ✓ Created/Updated brand: ${brand.name}`);
  }

  // Read machines.json
  console.log('🤖 Seeding machines...');
  const machinesPath = path.join(__dirname, '../../src/data/machines.json');
  const machinesData = JSON.parse(fs.readFileSync(machinesPath, 'utf-8'));

  for (const machineData of machinesData) {
    // Find brand ID by brand name
    let brandId: string | null = null;
    if (machineData.brand) {
      // Handle "Steiger / Sangiacomo" case
      const brandName = machineData.brand.includes('/')
        ? machineData.brand.split('/')[0].trim()
        : machineData.brand.trim();
      
      // Try to find matching brand
      for (const [name, id] of brandMap.entries()) {
        if (name.includes(brandName) || brandName.includes(name)) {
          brandId = id;
          break;
        }
      }
    }

    await prisma.machine.upsert({
      where: { id: machineData.id },
      update: {
        name: machineData.name,
        brand: machineData.brand,
        description: machineData.description,
        type: machineData.type,
        knittingSystems: machineData.knittingSystems,
        width: machineData.width,
        speed: machineData.speed,
        gauge: machineData.gauge,
        yarnGuides: machineData.yarnGuides,
        capabilities: machineData.capabilities,
        software: machineData.software,
        power: machineData.power,
        category: machineData.category,
        image: machineData.image,
        ...(machineData.en ? { en: machineData.en } : {}),
        brandId,
        inStock: true, // All existing machines are in stock by default
      },
      create: {
        id: machineData.id,
        name: machineData.name,
        brand: machineData.brand,
        description: machineData.description,
        type: machineData.type,
        knittingSystems: machineData.knittingSystems,
        width: machineData.width,
        speed: machineData.speed,
        gauge: machineData.gauge,
        yarnGuides: machineData.yarnGuides,
        capabilities: machineData.capabilities,
        software: machineData.software,
        power: machineData.power,
        category: machineData.category,
        image: machineData.image,
        ...(machineData.en ? { en: machineData.en } : {}),
        brandId,
        inStock: true, // All existing machines are in stock by default
      },
    });
    console.log(`  ✓ Created/Updated machine: ${machineData.name}`);
  }

  // Read products.json
  console.log('📦 Seeding products...');
  const productsPath = path.join(__dirname, '../../src/data/products.json');
  const productsData = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));

  for (const productData of productsData) {
    // Try to find brand ID from product name or discount field
    let brandId: string | null = null;
    if (productData.name.includes('Steiger')) {
      const steigerBrand = Array.from(brandMap.entries()).find(([name]) =>
        name.includes('Steiger')
      );
      if (steigerBrand) brandId = steigerBrand[1];
    }

    await prisma.product.upsert({
      where: { id: productData.id },
      update: {
        name: productData.name,
        description: productData.description,
        price: productData.price,
        image: productData.image,
        features: productData.features,
        category: productData.category,
        discount: productData.discount,
        brandId,
        inStock: true, // All existing products are in stock by default
      },
      create: {
        id: productData.id,
        name: productData.name,
        description: productData.description,
        price: productData.price,
        image: productData.image,
        features: productData.features,
        category: productData.category,
        discount: productData.discount,
        brandId,
        inStock: true, // All existing products are in stock by default
      },
    });
    console.log(`  ✓ Created/Updated product: ${productData.name}`);
  }

  console.log('✅ Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

