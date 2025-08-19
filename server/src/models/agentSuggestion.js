import mongoose from 'mongoose';

const agentSuggestionSchema = new mongoose.Schema({
  ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true },
  predictedCategory: { type: String, enum: ['billing', 'tech', 'shipping', 'other'] },
  articleIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Article' }],
  draftReply: { type: String },
  confidence: { type: Number, min: 0, max: 1 },
  autoClosed: { type: Boolean, default: false },
  modelInfo: {
    provider: String,
    model: String,
    promptVersion: String,
    latencyMs: Number,
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('AgentSuggestion', agentSuggestionSchema);