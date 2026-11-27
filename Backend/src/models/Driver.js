const mongoose = require('mongoose');

const DOCUMENT_TYPES = {
  licence: 'Driving licence',
  identity: 'Identity proof',
  registration: 'Vehicle registration',
};

const VEHICLE_TYPES = ['two_wheeler', 'three_wheeler', 'four_wheeler'];

const documentSchema = new mongoose.Schema(
  {
    file: { type: String, required: true },
    originalName: String,
    uploadedAt: { type: Date, required: true },
    status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
  },
  { _id: false },
);

const driverSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    phone: { type: String, required: true, unique: true },
    vehicle: {
      type: { type: String, enum: VEHICLE_TYPES, default: 'two_wheeler' },
      plate: { type: String, default: '' },
    },
    documents: {
      licence: documentSchema,
      identity: documentSchema,
      registration: documentSchema,
    },
    status: { type: String, enum: ['pending', 'approved', 'blocked'], default: 'pending' },
    online: { type: Boolean, default: false },
  },
  { timestamps: true },
);

/** The driver as the app sees it. Stored file paths are never sent out. */
driverSchema.methods.toClient = function toClient() {
  return {
    id: this.id,
    name: this.name,
    phone: this.phone,
    status: this.status,
    online: this.online,
    vehicle: { type: this.vehicle.type, plate: this.vehicle.plate },
    documents: Object.entries(DOCUMENT_TYPES).map(([type, label]) => {
      const document = this.documents?.[type];
      return {
        type,
        label,
        status: document?.status ?? 'missing',
        uploadedAt: document?.uploadedAt ?? null,
      };
    }),
  };
};

module.exports = {
  Driver: mongoose.model('Driver', driverSchema),
  DOCUMENT_TYPES,
  VEHICLE_TYPES,
};
