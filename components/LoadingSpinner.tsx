
import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-[var(--primary-color)]"></div>
  );
};

export default LoadingSpinner;
