const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  entity_type: {
    type: String,
    required: true,
    enum: ['task', 'submission', 'user', 'setting'],
  },
  entity_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  action: {
    type: String,
    required: true,
    enum: ['create', 'update', 'delete', 'submit', 'override', 'auto_archive', 'manual_archive'],
  },
  performed_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  created_at: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
});

// Compound indexes for efficient queries
auditLogSchema.index({ entity_type: 1, entity_id: 1, created_at: -1 });
auditLogSchema.index({ created_at: -1 });

module.exports = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);
