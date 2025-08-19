import mongoose from 'mongoose';

const articleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  body: { type: String, required: true },
  tags: [{ type: String }],
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  updatedAt: { type: Date, default: Date.now },
});

articleSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

articleSchema.index({ title: 'text', body: 'text', tags: 'text' });

export default mongoose.model('Article', articleSchema);