const router = require('express').Router();
const prisma = require('../prismaClient');
const { protect, requireRole } = require('../middleware/auth');

// POST /api/orders — customer places an order
router.post('/', protect, requireRole('customer'), async (req, res) => {
  const { shopId, items, deliveryAddress, paymentMethod, notes } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Order must have at least one item.' });
  }

  try {
    const shop = await prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) return res.status(404).json({ success: false, message: 'Shop not found.' });

    // Validate all products and compute total in a single DB call
    const productIds = items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, shopId, isAvailable: true }
    });

    if (products.length !== items.length) {
      return res.status(400).json({ success: false, message: 'One or more products are unavailable.' });
    }

    let subtotal = 0;
    const orderItemsData = [];

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${product.name}".`
        });
      }
      subtotal += product.price * item.quantity;
      orderItemsData.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        image: product.images[0] || ''
      });
    }

    const deliveryFee = shop.deliveryFee || 0;
    const total = subtotal + deliveryFee;

    if (shop.minOrderAmount && subtotal < shop.minOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount is ₵${shop.minOrderAmount}.`
      });
    }

    // Create order + items + decrement stock atomically
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          customerId: req.user.id,
          shopId,
          subtotal,
          deliveryFee,
          total,
          deliveryAddress: deliveryAddress || {},
          paymentMethod: paymentMethod || 'cash_on_delivery',
          notes,
          statusHistory: [{ status: 'pending', note: 'Order placed', timestamp: new Date() }],
          items: { create: orderItemsData }
        },
        include: {
          items: true,
          shop: { select: { id: true, name: true, campus: true } }
        }
      });

      // Decrement stock for each product
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } }
        });
      }

      return newOrder;
    });

    res.status(201).json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/orders
router.get('/', protect, async (req, res) => {
  try {
    let where = {};

    if (req.user.role === 'customer') {
      where.customerId = req.user.id;
    } else if (req.user.role === 'vendor') {
      const shop = await prisma.shop.findUnique({ where: { ownerId: req.user.id } });
      if (!shop) return res.json({ success: true, orders: [] });
      where.shopId = shop.id;
    }
    // admin: no filter — sees all orders

    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        shop: { select: { id: true, name: true, campus: true } },
        items: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, count: orders.length, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/orders/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        shop: { select: { id: true, name: true, campus: true, contactPhone: true } },
        items: { include: { product: { select: { id: true, name: true, images: true } } } }
      }
    });

    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    const shop = await prisma.shop.findUnique({ where: { id: order.shopId } });
    const isCustomer = order.customerId === req.user.id;
    const isVendor = shop?.ownerId === req.user.id;

    if (!isCustomer && !isVendor && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/orders/:id/status — vendor/admin updates status
router.patch('/:id/status', protect, requireRole('vendor', 'admin'), async (req, res) => {
  const validStatuses = ['confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];
  const { status, note } = req.body;

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status.' });
  }

  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    const updatedHistory = [
      ...(Array.isArray(order.statusHistory) ? order.statusHistory : []),
      { status, note: note || '', timestamp: new Date() }
    ];

    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: { status, statusHistory: updatedHistory },
      include: { items: true, shop: { select: { id: true, name: true } } }
    });

    res.json({ success: true, order: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
