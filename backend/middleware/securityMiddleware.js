// Basic Input Sanitizer to prevent XSS attacks
const sanitizeInput = (data) => {
  if (typeof data === 'string') {
    // Replace script tags and dangerous HTML/javascript references
    return data
      .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/javascript:/gi, '');
  } else if (typeof data === 'object' && data !== null) {
    for (const key in data) {
      data[key] = sanitizeInput(data[key]);
    }
  }
  return data;
};

const xssSanitizer = (req, res, next) => {
  if (req.body) req.body = sanitizeInput(req.body);
  if (req.query) req.query = sanitizeInput(req.query);
  if (req.params) req.params = sanitizeInput(req.params);
  next();
};

// Request logger for audit trails
const requestLogger = (req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
  next();
};

module.exports = { xssSanitizer, requestLogger };
