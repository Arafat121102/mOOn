/**
 * Run with: npm run db:seed
 * Creates an admin user and sample data. Safe to run multiple times.
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // ── Admin user ───────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash('admin123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@moon.com' },
    update: {},
    create: {
      name: 'mOOn Admin',
      email: 'admin@moon.com',
      password: hashedPassword,
      role: 'admin',
      campus: 'University_of_Ghana_Legon',
      shopScope: 'nationwide'
    }
  });
  console.log('✅ Admin created:', admin.email);

  // ── Sample vendor ────────────────────────────────────────────
  const vendorPassword = await bcrypt.hash('vendor123', 12);

  const vendor = await prisma.user.upsert({
    where: { email: 'vendor@moon.com' },
    update: {},
    create: {
      name: 'Kwame Asante',
      email: 'vendor@moon.com',
      password: vendorPassword,
      role: 'vendor',
      campus: 'University_of_Ghana_Legon',
      shopScope: 'campus'
    }
  });
  console.log('✅ Vendor created:', vendor.email);

  // ── Sample shop ──────────────────────────────────────────────
  const shop = await prisma.shop.upsert({
    where: { ownerId: vendor.id },
    update: {},
    create: {
      ownerId: vendor.id,
      name: 'Campus Bookstore',
      description: 'Your one-stop shop for textbooks and stationery on Legon campus.',
      category: 'textbooks',
      scope: 'campus',
      campus: 'University_of_Ghana_Legon',
      contactPhone: '0244000001',
      isVerified: true,
      deliveryFee: 5,
      minOrderAmount: 10,
      estimatedDeliveryTime: '30-45 mins'
    }
  });
  console.log('✅ Shop created:', shop.name);

  // ── Sample products ──────────────────────────────────────────
  const products = [
    { name: 'Biochemistry Textbook', price: 45, originalPrice: 60, category: 'textbooks', stock: 20, tags: ['biochem', 'science'] },
    { name: 'Lecture Note Pad (A4)', price: 8, category: 'stationery', stock: 100, tags: ['notepad', 'writing'] },
    { name: 'Scientific Calculator', price: 85, originalPrice: 110, category: 'electronics', stock: 15, tags: ['calc', 'math'] },
    { name: 'Campus Hoodie (UG)', price: 120, category: 'fashion', stock: 30, tags: ['hoodie', 'merch'] }
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { id: `seed-${p.name.replace(/\s+/g, '-').toLowerCase()}` },
      update: {},
      create: { id: `seed-${p.name.replace(/\s+/g, '-').toLowerCase()}`, shopId: shop.id, ...p }
    }).catch(() => prisma.product.create({ data: { shopId: shop.id, ...p } }));
  }
  console.log('✅ Sample products created.');

  // ── Sample customer ──────────────────────────────────────────
  const customerPassword = await bcrypt.hash('customer123', 12);
  await prisma.user.upsert({
    where: { email: 'student@ug.edu.gh' },
    update: {},
    create: {
      name: 'Ama Mensah',
      email: 'student@ug.edu.gh',
      password: customerPassword,
      role: 'customer',
      campus: 'University_of_Ghana_Legon',
      shopScope: 'campus'
    }
  });
  console.log('✅ Sample customer created: student@ug.edu.gh / customer123');
}

main()
  .catch(e => { console.error('❌ Seed error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
