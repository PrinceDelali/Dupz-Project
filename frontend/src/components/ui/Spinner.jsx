import React from 'react';

const Spinner = ({ size = 'md', color = 'black' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };

  const colorClasses = {
    black: 'border-black',
    red: 'border-red-600',
    purple: 'border-purple-600',
    blue: 'border-blue-600'
  };

  return (
    <div className={`animate-spin rounded-full border-2 border-t-2 ${sizeClasses[size]} ${colorClasses[color]} border-t-transparent`} />
  );
};

export default Spinner; 