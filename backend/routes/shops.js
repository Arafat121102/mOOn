const express = require('express');
const router = express.Router();
const Shop = require('../models/Shop');
const { protect, requireRole } = require('../middleware/auth');

// GET /api/shops  — filtered by user scope preference (campus or nationwide)
// Query params: ?campus=KNUST&scope=campus|nationwide|region&category=snacks
router.get('/', async (req, res) => {
  try {
    const { campus, scope, region, category } = req.query;
    const filter = { isActive: true };

    if (category) filter.category = category;

    if (scope === 'nationwide') {
      // Return all verified shops across Ghana
      filter.isVerified = true;
    } else if (scope === 'region' && region) {
      filter.$or = [
        { scope: 'nationwide' },
        { scope: 'region', region },
        { scope: 'campus', campus }
      ];
    } else if (campus) {
      // Default: campus scope — return campus shops + shops that serve nationwide
      filter.$or = [
        { scope: 'campus', campus },
        { scope: 'nationwide' },
        { scope: 'region' } // region-wide shops are also visible
      ];
    }

    const shops = await Shop.find(filter).populate('owner', 'name email').sort('-createdAt');
    res.json({ success: true, count: shops.length, shops });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/shops/:id
router.get('/:id', async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id).populate('owner', 'name email phone');
    if (!shop) return res.status(404).json({ success: false, message: 'Shop not found.' });
    res.json({ success: true, shop });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/shops  — vendors create their shop
router.post('/', protect, requireRole('vendor', 'admin'), async (req, res) => {
  try {
    const { name, description, category, scope, campus, region, contactPhone, contactEmail, deliveryFee, minOrderAmount, estimatedDeliveryTime } = req.body;

    const existing = await Shop.findOne({ owner: req.user._id });
    if (existing && req.user.role === 'vendor') {
      return res.status(400).json({ success: false, message: 'You already have a shop. Only one shop per vendor.' });
    }

    const shop = await Shop.create({
      owner: req.user._id, name, description, category, scope: scope || 'campus',
      campus: campus || req.user.campus, region, contactPhone, contactEmail,
      deliveryFee, minOrderAmount, estimatedDeliveryTime
    });

    res.status(201).json({ success: true, shop });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/shops/:id  — vendor updates their own shop
router.patch('/:id', protect, requireRole('vendor', 'admin'), async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) return res.status(404).json({ success: false, message: 'Shop not found.' });

    if (shop.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not your shop.' });
    }

    const updated = await Shop.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, shop: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/shops/vendor/mine  — get the logged-in vendor's shop
router.get('/vendor/mine', protect, requireRole('vendor'), async (req, res) => {
  try {
    const shop = await Shop.findOne({ owner: req.user._id });
    if (!shop) return res.status(404).json({ success: false, message: 'No shop found for this vendor.' });
    res.json({ success: true, shop });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
