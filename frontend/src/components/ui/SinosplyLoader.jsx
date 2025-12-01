import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

const SinosplyLoader = ({ message }) => {
  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50">
      {/* Sinosply brand text */}
      <h1 className="text-3xl font-bold mb-6 text-black">Sinosply</h1>
      {/* Simple spinner */}
      <motion.div
        className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin mb-6"
        initial={{ rotate: 0 }}
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
      />
      {/* Loading message */}
      <p className="text-gray-700 text-lg font-medium">{message || 'Loading...'}</p>
    </div>
  );
};

SinosplyLoader.propTypes = {
  message: PropTypes.string
};

export default SinosplyLoader;