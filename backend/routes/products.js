const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Shop = require('../models/Shop');
const { protect, requireRole } = require('../middleware/auth');

// GET /api/products
// Query: ?campus=UG&scope=campus|nationwide&category=snacks&search=rice&shopId=xxx
router.get('/', async (req, res) => {
  try {
    const { campus, scope, region, category, search, shopId, page = 1, limit = 20 } = req.query;

    // First, find eligible shops based on scope preference
    let shopFilter = { isActive: true };
    if (shopId) {
      shopFilter._id = shopId;
    } else if (scope === 'nationwide') {
      shopFilter.isVerified = true;
    } else if (scope === 'region' && region) {
      shopFilter.$or = [
        { scope: 'nationwide' },
        { scope: 'region', region },
        { scope: 'campus', campus }
      ];
    } else if (campus) {
      shopFilter.$or = [
        { scope: 'campus', campus },
        { scope: 'nationwide' },
        { scope: 'region' }
      ];
    }

    const eligibleShops = await Shop.find(shopFilter).select('_id');
    const shopIds = eligibleShops.map(s => s._id);

    const productFilter = { shop: { $in: shopIds }, isAvailable: true };
    if (category) productFilter.category = category;
    if (search) productFilter.$text = { $search: search };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [products, total] = await Promise.all([
      Product.find(productFilter)
        .populate('shop', 'name campus scope deliveryFee estimatedDeliveryTime rating')
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit)),
      Product.countDocuments(productFilter)
    ]);

    res.json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      products
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('shop');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/products  — vendor adds a product
router.post('/', protect, requireRole('vendor', 'admin'), async (req, res) => {
  try {
    const shop = await Shop.findOne({ owner: req.user._id });
    if (!shop) return res.status(400).json({ success: false, message: 'Create a shop first.' });

    const { name, description, price, originalPrice, category, tags, stock, images } = req.body;
    const product = await Product.create({
      shop: shop._id, name, description, price, originalPrice, category, tags, stock,
      images: images || []
    });

    res.status(201).json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/products/:id
router.patch('/:id', protect, requireRole('vendor', 'admin'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('shop');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

    if (product.shop.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not your product.' });
    }

    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, product: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/products/:id
router.delete('/:id', protect, requireRole('vendor', 'admin'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('shop');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

    if (product.shop.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not your product.' });
    }

    await product.deleteOne();
    res.json({ success: true, message: 'Product deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/products/vendor/mine — vendor's own products
router.get('/vendor/mine', protect, requireRole('vendor'), async (req, res) => {
  try {
    const shop = await Shop.findOne({ owner: req.user._id });
    if (!shop) return res.status(404).json({ success: false, message: 'No shop found.' });
    const products = await Product.find({ shop: shop._id }).sort('-createdAt');
    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
