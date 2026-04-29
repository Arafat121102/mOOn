const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  description: { type: String },
  logo: { type: String },
  coverImage: { type: String },
  category: {
    type: String,
    enum: ['textbooks', 'stationery', 'electronics', 'snacks', 'fashion', 'services', 'general'],
    required: true
  },

  // Location scope — vendor sets whether they serve only their campus or nationwide/region
  scope: {
    type: String,
    enum: ['campus', 'region', 'nationwide'],
    default: 'campus'
  },
  campus: {
    type: String,
    enum: [
      'University of Ghana, Legon',
      'KNUST, Kumasi',
      'University of Cape Coast',
      'University of Professional Studies',
      'University of Energy and Natural Resources',
      'Ghana Institute of Management and Public Administration',
      'University of Health and Allied Sciences'
    ]
  },
  region: { type: String }, // e.g. "Greater Accra", "Ashanti"

  contactPhone: { type: String },
  contactEmail: { type: String },

  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },

  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },

  deliveryFee: { type: Number, default: 0 }, // in GHS
  minOrderAmount: { type: Number, default: 0 },
  estimatedDeliveryTime: { type: String, default: '30-45 mins' },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Shop', shopSchema);
