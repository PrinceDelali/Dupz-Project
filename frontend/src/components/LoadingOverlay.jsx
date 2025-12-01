import { motion } from 'framer-motion';

const LoadingOverlay = ({ message }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center"
    >
      <div className="bg-gray-800 rounded-lg p-8 flex flex-col items-center space-y-4">
        <div className="spinner"></div>
        <p className="text-white text-lg font-medium">{message}</p>
      </div>
    </motion.div>
  );
};

export default LoadingOverlay; 