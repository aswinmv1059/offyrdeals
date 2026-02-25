const { validationResult } = require('express-validator');

const validateMiddleware = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const all = errors.array();
    return res.status(400).json({
      message: all[0]?.msg || 'Validation failed',
      errors: all
    });
  }
  return next();
};

module.exports = validateMiddleware;
