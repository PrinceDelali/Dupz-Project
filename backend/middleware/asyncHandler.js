/**
 * Async handler to wrap async route handlers and controllers
 * This eliminates the need for multiple try/catch blocks
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler; 