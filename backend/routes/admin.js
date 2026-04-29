const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Shop = require('../models/Shop');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { protect, requireRole } = require('../middleware/auth');

// All admin routes require auth + admin role
router.use(protect, requireRole('admin'));

// GET /api/admin/stats — dashboard overview
router.get('/stats', async (req, res) => {
  try {
    const [totalUsers, totalVendors, totalShops, totalOrders, pendingOrders, totalProducts] = await Promise.all([
      User.countDocuments({ role: 'customer' }),
      User.countDocuments({ role: 'vendor' }),
      Shop.countDocuments(),
      Order.countDocuments(),
      Order.countDocuments({ status: 'pending' }),
      Product.countDocuments()
    ]);

    // Revenue (sum of delivered orders)
    const revenueResult = await Order.aggregate([
      { $match: { status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    // Orders by status
    const ordersByStatus = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Top campuses by order volume
    const ordersByCampus = await Order.aggregate([
      { $lookup: { from: 'shops', localField: 'shop', foreignField: '_id', as: 'shopData' } },
      { $unwind: '$shopData' },
      { $group: { _id: '$shopData.campus', count: { $sum: 1 }, revenue: { $sum: '$total' } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers, totalVendors, totalShops, totalOrders, pendingOrders, totalProducts,
        totalRevenue, ordersByStatus, ordersByCampus
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const { role, campus } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (campus) filter.campus = campus;
    const users = await User.find(filter).select('-password').sort('-createdAt');
    res.json({ success: true, count: users.length, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/admin/shops/:id/verify — approve a vendor shop
router.patch('/shops/:id/verify', async (req, res) => {
  try {
    const shop = await Shop.findByIdAndUpdate(
      req.params.id,
      { isVerified: req.body.isVerified !== false },
      { new: true }
    );
    if (!shop) return res.status(404).json({ success: false, message: 'Shop not found.' });
    res.json({ success: true, shop });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/shops — all shops with filters
router.get('/shops', async (req, res) => {
  try {
    const { isVerified, campus, scope } = req.query;
    const filter = {};
    if (isVerified !== undefined) filter.isVerified = isVerified === 'true';
    if (campus) filter.campus = campus;
    if (scope) filter.scope = scope;
    const shops = await Shop.find(filter).populate('owner', 'name email').sort('-createdAt');
    res.json({ success: true, count: shops.length, shops });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
