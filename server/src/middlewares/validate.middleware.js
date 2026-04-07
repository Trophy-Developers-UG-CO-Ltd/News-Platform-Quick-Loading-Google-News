/**
 * Joi validation middleware
 * Validates request body, params, and query against Joi schemas
 * @module middlewares/validate.middleware
 */

/**
 * Validate request data against a Joi schema
 * @param {Object} schema - Joi schema object with optional body, params, query keys
 */
const validate = (schema) => {
  return (req, res, next) => {
    const errors = [];

    ['body', 'params', 'query'].forEach((source) => {
      if (schema[source]) {
        const { error, value } = schema[source].validate(req[source], {
          abortEarly: false,
          stripUnknown: true,
        });

        if (error) {
          error.details.forEach((detail) => {
            errors.push({
              field: detail.path.join('.'),
              message: detail.message.replace(/"/g, ''),
            });
          });
        } else {
          req[source] = value; // Replace with sanitized values
        }
      }
    });

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    next();
  };
};

module.exports = { validate };

// MukonoTalks

