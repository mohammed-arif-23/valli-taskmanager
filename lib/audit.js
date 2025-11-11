const AuditLog = require('@/models/AuditLog');

/**
 * Create an audit log entry (append-only, never deleted)
 * Logs all CRUD operations and state changes with UTC timestamps
 * 
 * @param {string} entityType - Type of entity: 'task', 'submission', 'user', 'setting'
 * @param {ObjectId} entityId - ID of the entity
 * @param {string} action - Action performed: 'create', 'update', 'delete', 'submit', 'override', 'auto_archive'
 * @param {ObjectId} performedBy - User ID who performed the action
 * @param {object} metadata - Additional data (before/after values, reason, etc.)
 * @returns {Promise<AuditLog>} Created audit log document
 */
async function createAuditLog(entityType, entityId, action, performedBy, metadata = {}) {
  try {
    const auditLog = await AuditLog.create({
      entity_type: entityType,
      entity_id: entityId,
      action,
      performed_by: performedBy,
      metadata,
      created_at: new Date(), // UTC timestamp
    });

    return auditLog;
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw - audit logging should not break main operations
    return null;
  }
}

module.exports = {
  createAuditLog,
};
