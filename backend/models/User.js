const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  phone: { type: String },
  role: { type: String, enum: ['customer', 'vendor', 'admin'], default: 'customer' },

  // Campus & delivery scope preference
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
  // 'campus' = only see shops on selected campus; 'nationwide' = see all shops across Ghana
  shopScope: {
    type: String,
    enum: ['campus', 'nationwide'],
    default: 'campus'
  },
  region: { type: String }, // Ashanti, Greater Accra, Western, etc.

  deliveryAddresses: [{
    label: String, // e.g. "Mensah Sarbah Hall", "Off Campus"
    hostel: String,
    roomNumber: String,
    landmark: String,
    isDefault: { type: Boolean, default: false }
  }],

  createdAt: { type: Date, default: Date.now }
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
