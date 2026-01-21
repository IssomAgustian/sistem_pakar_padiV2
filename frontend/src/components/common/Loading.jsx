import React from 'react';

const Loading = ({ size = 'md', text = 'Loading...' }) => {
  const sizeClasses = {
    sm: 'loading-sm',
    md: 'loading-md',
    lg: 'loading-lg'
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <span className={`loading loading-spinner ${sizeClasses[size]} text-primary`}></span>
      {text && <p className="mt-4 text-gray-600">{text}</p>}
    </div>
  );
};

export default Loading;
