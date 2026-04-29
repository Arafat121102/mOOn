const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const Shop = require('../models/Shop');
const { protect, requireRole } = require('../middleware/auth');

// POST /api/orders — customer places an order
router.post('/', protect, requireRole('customer'), async (req, res) => {
  try {
    const { shopId, items, deliveryAddress, paymentMethod, notes } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Order must have at least one item.' });
    }

    const shop = await Shop.findById(shopId);
    if (!shop) return res.status(404).json({ success: false, message: 'Shop not found.' });

    // Validate items and calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product || !product.isAvailable) {
        return res.status(400).json({ success: false, message: `Product ${item.productId} is unavailable.` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}.` });
      }

      subtotal += product.price * item.quantity;
      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        image: product.images[0] || ''
      });

      // Reduce stock
      await Product.findByIdAndUpdate(product._id, { $inc: { stock: -item.quantity } });
    }

    const deliveryFee = shop.deliveryFee || 0;
    const total = subtotal + deliveryFee;

    if (shop.minOrderAmount && subtotal < shop.minOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount is ₵${shop.minOrderAmount}.`
      });
    }

    const order = await Order.create({
      customer: req.user._id,
      shop: shopId,
      items: orderItems,
      subtotal,
      deliveryFee,
      total,
      deliveryAddress,
      paymentMethod: paymentMethod || 'cash_on_delivery',
      notes,
      statusHistory: [{ status: 'pending', note: 'Order placed' }]
    });

    await order.populate('shop', 'name campus');
    res.status(201).json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/orders — customer views their orders
router.get('/', protect, async (req, res) => {
  try {
    const filter = req.user.role === 'customer'
      ? { customer: req.user._id }
      : req.user.role === 'vendor'
        ? {} // vendor sees orders for their shop (populated below)
        : {}; // admin sees all

    let query = Order.find(filter)
      .populate('customer', 'name email phone')
      .populate('shop', 'name campus')
      .sort('-createdAt');

    // If vendor, filter by their shop
    if (req.user.role === 'vendor') {
      const shop = await Shop.findOne({ owner: req.user._id });
      if (!shop) return res.json({ success: true, orders: [] });
      query = Order.find({ shop: shop._id })
        .populate('customer', 'name email phone')
        .populate('shop', 'name campus')
        .sort('-createdAt');
    }

    const orders = await query;
    res.json({ success: true, count: orders.length, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/orders/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name email phone')
      .populate('shop', 'name campus contactPhone');

    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    // Ensure the user is the customer, the shop owner (vendor), or an admin
    const shop = await Shop.findById(order.shop._id);
    const isOwner = order.customer._id.toString() === req.user._id.toString();
    const isVendor = shop && shop.owner.toString() === req.user._id.toString();
    if (!isOwner && !isVendor && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/orders/:id/status — vendor/admin updates order status
router.patch('/:id/status', protect, requireRole('vendor', 'admin'), async (req, res) => {
  try {
    const { status, note } = req.body;
    const validStatuses = ['confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    order.status = status;
    order.statusHistory.push({ status, note: note || '' });
    await order.save();

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
