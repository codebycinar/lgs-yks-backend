const Joi = require('joi');

const userRegistrationSchema = Joi.object({
  phoneNumber: Joi.string()
    .pattern(/^(\+90|0)?[0-9]{10}$/)
    .required()
    .messages({
      'string.pattern.base': 'Phone number must be a valid Turkish phone number'
    }),
  name: Joi.string().min(2).max(50).required(),
  surname: Joi.string().min(2).max(50).required(),
  classId: Joi.string().uuid().required(),
  gender: Joi.string().valid('male', 'female').required()
});

const smsVerificationSchema = Joi.object({
  phoneNumber: Joi.string()
    .pattern(/^(\+90|0)?[0-9]{10}$/)
    .required(),
  verificationCode: Joi.string().length(6).required()
});

const loginSchema = Joi.object({
  phoneNumber: Joi.string()
    .pattern(/^(\+90|0)?[0-9]{10}$/)
    .required()
});

const goalSchema = Joi.object({
  description: Joi.string().min(5).max(500).required(),
  targetDate: Joi.date().greater('now').optional()
});

const weeklyProgramSchema = Joi.object({
  startDate: Joi.date().required(),
  endDate: Joi.date().greater(Joi.ref('startDate')).required(),
  title: Joi.string().min(5).max(100).required()
});

const programTaskSchema = Joi.object({
  weeklyProgramId: Joi.string().uuid().required(),
  description: Joi.string().min(3).max(300).required(),
  taskDate: Joi.date().required(),
  topicId: Joi.string().uuid().optional()
});

const topicProgressSchema = Joi.object({
  topicId: Joi.string().uuid().required(),
  status: Joi.string().valid('not_started', 'in_progress', 'learned', 'needs_review').required()
});

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details[0].message
      });
    }
    next();
  };
};

module.exports = {
  validate,
  userRegistrationSchema,
  smsVerificationSchema,
  loginSchema,
  goalSchema,
  weeklyProgramSchema,
  programTaskSchema,
  topicProgressSchema
};