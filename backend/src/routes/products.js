const router = require('express').Router();
const prisma = require('../prismaClient');
const { protect, requireRole } = require('../middleware/auth');

// Build shop IDs allowed by user's scope preference
const getEligibleShopIds = async ({ scope, campus, region }) => {
  let where = { isActive: true };

  if (scope === 'nationwide') {
    where.isVerified = true;
  } else if (scope === 'region' && region) {
    where.OR = [
      { scope: 'nationwide', isVerified: true },
      { scope: 'region', region },
      { scope: 'campus', campus }
    ];
  } else if (campus) {
    where.OR = [
      { scope: 'campus', campus },
      { scope: 'nationwide', isVerified: true },
      { scope: 'region' }
    ];
  }

  const shops = await prisma.shop.findMany({ where, select: { id: true } });
  return shops.map((s) => s.id);
};

// GET /api/products
router.get('/', async (req, res) => {
  const { scope, campus, region, category, search, shopId, page = 1, limit = 20 } = req.query;
  try {
    let shopIds;
    if (shopId) {
      shopIds = [shopId];
    } else {
      shopIds = await getEligibleShopIds({ scope, campus, region });
    }

    const where = {
      shopId: { in: shopIds },
      isAvailable: true,
      ...(category && { category }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { tags: { has: search } }
        ]
      })
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [products, total] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        include: {
          shop: {
            select: {
              id: true, name: true, campus: true, scope: true,
              deliveryFee: true, estimatedDeliveryTime: true, rating: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.product.count({ where })
    ]);

    res.json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      products
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/products/vendor/mine
router.get('/vendor/mine', protect, requireRole('vendor'), async (req, res) => {
  try {
    const shop = await prisma.shop.findUnique({ where: { ownerId: req.user.id } });
    if (!shop) return res.status(404).json({ success: false, message: 'No shop found.' });

    const products = await prisma.product.findMany({
      where: { shopId: shop.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { shop: true }
    });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/products
router.post('/', protect, requireRole('vendor', 'admin'), async (req, res) => {
  try {
    const shop = await prisma.shop.findUnique({ where: { ownerId: req.user.id } });
    if (!shop) return res.status(400).json({ success: false, message: 'Create a shop first.' });

    const { name, description, price, originalPrice, category, tags, stock, images } = req.body;

    const product = await prisma.product.create({
      data: {
        shopId: shop.id,
        name,
        description,
        price: parseFloat(price),
        originalPrice: originalPrice ? parseFloat(originalPrice) : null,
        category,
        tags: tags || [],
        stock: parseInt(stock) || 0,
        images: images || []
      }
    });
    res.status(201).json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/products/:id
router.patch('/:id', protect, requireRole('vendor', 'admin'), async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { shop: true }
    });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    if (product.shop.ownerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not your product.' });
    }

    const { name, description, price, originalPrice, category, tags, stock, images, isAvailable } = req.body;

    const updated = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(originalPrice !== undefined && { originalPrice: originalPrice ? parseFloat(originalPrice) : null }),
        ...(category && { category }),
        ...(tags && { tags }),
        ...(stock !== undefined && { stock: parseInt(stock) }),
        ...(images && { images }),
        ...(isAvailable !== undefined && { isAvailable })
      }
    });
    res.json({ success: true, product: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/products/:id
router.delete('/:id', protect, requireRole('vendor', 'admin'), async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { shop: true }
    });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    if (product.shop.ownerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not your product.' });
    }

    await prisma.product.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Product deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
