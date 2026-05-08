const router = require('express').Router();
const prisma = require('../prismaClient');
const { protect, requireRole } = require('../middleware/auth');

router.use(protect, requireRole('admin'));

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const [
      totalUsers, totalVendors, totalShops,
      totalOrders, pendingOrders, totalProducts,
      revenueResult, ordersByStatus, ordersByCampus
    ] = await prisma.$transaction([
      prisma.user.count({ where: { role: 'customer' } }),
      prisma.user.count({ where: { role: 'vendor' } }),
      prisma.shop.count(),
      prisma.order.count(),
      prisma.order.count({ where: { status: 'pending' } }),
      prisma.product.count(),
      // Sum total revenue from delivered orders
      prisma.order.aggregate({
        where: { status: 'delivered' },
        _sum: { total: true }
      }),
      // Orders grouped by status
      prisma.order.groupBy({
        by: ['status'],
        _count: { _all: true }
      }),
      // Orders grouped by shop campus
      prisma.order.findMany({
        include: { shop: { select: { campus: true } } }
      })
    ]);

    // Aggregate campus counts from orders
    const campusMap = {};
    for (const order of ordersByCampus) {
      const campus = order.shop?.campus || 'Unknown';
      campusMap[campus] = (campusMap[campus] || 0) + 1;
    }
    const campusStats = Object.entries(campusMap)
      .map(([campus, count]) => ({ campus, count }))
      .sort((a, b) => b.count - a.count);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalVendors,
        totalShops,
        totalOrders,
        pendingOrders,
        totalProducts,
        totalRevenue: revenueResult._sum.total || 0,
        ordersByStatus: ordersByStatus.map((s) => ({ status: s.status, count: s._count._all })),
        ordersByCampus: campusStats
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  const { role, campus } = req.query;
  try {
    const users = await prisma.user.findMany({
      where: {
        ...(role && { role }),
        ...(campus && { campus })
      },
      select: {
        id: true, name: true, email: true, phone: true, role: true,
        campus: true, shopScope: true, region: true, createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, count: users.length, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/shops
router.get('/shops', async (req, res) => {
  const { isVerified, campus, scope } = req.query;
  try {
    const shops = await prisma.shop.findMany({
      where: {
        ...(isVerified !== undefined && { isVerified: isVerified === 'true' }),
        ...(campus && { campus }),
        ...(scope && { scope })
      },
      include: { owner: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, count: shops.length, shops });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/admin/shops/:id/verify
router.patch('/shops/:id/verify', async (req, res) => {
  try {
    const shop = await prisma.shop.update({
      where: { id: req.params.id },
      data: { isVerified: req.body.isVerified !== false }
    });
    res.json({ success: true, shop });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ success: false, message: 'Shop not found.' });
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'User deleted.' });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ success: false, message: 'User not found.' });
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
