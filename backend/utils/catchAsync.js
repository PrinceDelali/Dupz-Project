/**
 * Wrapper function to catch async errors in controllers
 * @param {Function} fn - The async controller function
 * @returns {Function} Express middleware function
 */
const catchAsync = fn => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

export default catchAsync; 