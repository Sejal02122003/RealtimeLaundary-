const mongoose = require('mongoose');

const SERVICE_CATEGORIES = {
  'wash-iron': 'Wash & iron',
  'by-weight': 'By weight',
  'dry-clean': 'Dry clean',
  packages: 'Packages',
  ironing: 'Ironing',
  premium: 'Premium',
};

const PRICING_MODELS = { piece: 'Per piece', kg: 'Per kg', pack: 'Per package' };

const serviceSchema = new mongoose.Schema({
  category: { type: String, enum: Object.keys(SERVICE_CATEGORIES), required: true },
  name: { type: String, required: true, trim: true, maxlength: 60 },
  pricingModel: { type: String, enum: Object.keys(PRICING_MODELS), required: true },
  price: { type: Number, required: true, min: 1 },
  available: { type: Boolean, default: true },
  demo: Boolean,
});
serviceSchema.index({ category: 1, name: 1 }, { unique: true });

const offerSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  type: { type: String, enum: ['flat', 'percent'], required: true },
  value: { type: Number, required: true },
  minimum: { type: Number, default: 0 },
  firstOrderOnly: { type: Boolean, default: false },
  active: { type: Boolean, default: true },
  demo: Boolean,
});

module.exports = {
  Service: mongoose.model('Service', serviceSchema),
  Offer: mongoose.model('Offer', offerSchema),
  SERVICE_CATEGORIES,
  PRICING_MODELS,
};
