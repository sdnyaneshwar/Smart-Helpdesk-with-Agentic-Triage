import mongoose from 'mongoose';

const configSchema = new mongoose.Schema({
  autoCloseEnabled: { type: Boolean, default: true },
  confidenceThreshold: { type: Number, min: 0, max: 1, default: 0.78 },
  slaHours: { type: Number, default: 24 },
});

export default mongoose.model('Config', configSchema);