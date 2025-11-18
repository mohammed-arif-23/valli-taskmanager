const Joi = require('joi');

const taskSubmissionSchema = Joi.object({
  status: Joi.string().valid('completed', 'partial', 'not_started').required(),
  not_started_reason: Joi.when('status', {
    is: 'not_started',
    then: Joi.string().min(1).max(200).required(),
    otherwise: Joi.forbidden(),
  }),
  evidence_url: Joi.string().uri().optional().allow(''),
});


const taskCreationSchema = Joi.object({
  title: Joi.string().min(1).max(200).required(),
  description: Joi.string().min(1).max(2000).required(),
  type: Joi.string().valid('primary', 'secondary').required(),
  priority: Joi.string().valid('low', 'medium', 'high').required(),
  default_points: Joi.number().integer().min(1).required(),
  due_date_ist: Joi.string().isoDate().required(),
  department_id: Joi.string().required(),
  recurrence: Joi.object().optional().allow(null),
  allow_late_submission: Joi.boolean().optional(),
});


const taskUpdateSchema = Joi.object({
  title: Joi.string().min(1).max(200).optional(),
  description: Joi.string().min(1).max(2000).optional(),
  type: Joi.string().valid('primary', 'secondary').optional(),
  priority: Joi.string().valid('low', 'medium', 'high').optional(),
  default_points: Joi.number().integer().min(1).optional(),
  due_date_ist: Joi.string().isoDate().optional(),
  department_id: Joi.string().optional(),
  recurrence: Joi.object().optional().allow(null),
  allow_late_submission: Joi.boolean().optional(),
  row_version: Joi.number().integer().required(),
});

const settingsUpdateSchema = Joi.object({
  rounding_policy: Joi.object({
    method: Joi.string().valid('half_up').optional(),
    partial_ratio: Joi.number().min(0).max(1).optional(),
  }).optional(),
  thresholds: Joi.object({
    red: Joi.number().min(0).max(100).optional(),
    orange: Joi.number().min(0).max(100).optional(),
    green: Joi.number().min(0).max(100).optional(),
  }).optional(),
  scoring_mode: Joi.string().valid('absolute', 'percentage').optional(),
});

const submissionOverrideSchema = Joi.object({
  points_awarded: Joi.number().integer().min(0).required(),
  reason: Joi.string().min(1).max(500).required(),
  row_version: Joi.number().integer().required(),
});

module.exports = {
  taskSubmissionSchema,
  taskCreationSchema,
  taskUpdateSchema,
  settingsUpdateSchema,
  submissionOverrideSchema,
};
