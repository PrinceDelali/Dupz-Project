import User from '../models/User.js';

const updateLastActive = async (req, res, next) => {
  if (req.user) {
    try {
      await User.findByIdAndUpdate(req.user._id, {
        lastActive: new Date()
      });
    } catch (error) {
      console.error('Error updating last active:', error);
    }
  }
  next();
};

export default updateLastActive; 