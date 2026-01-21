import React from 'react';
import { FiCheckCircle, FiAlertCircle, FiAlertTriangle, FiInfo } from 'react-icons/fi';

const Alert = ({ type = 'info', message, onClose }) => {
  const types = {
    success: {
      bg: 'alert-success',
      icon: <FiCheckCircle className="w-6 h-6" />
    },
    error: {
      bg: 'alert-error',
      icon: <FiAlertCircle className="w-6 h-6" />
    },
    warning: {
      bg: 'alert-warning',
      icon: <FiAlertTriangle className="w-6 h-6" />
    },
    info: {
      bg: 'alert-info',
      icon: <FiInfo className="w-6 h-6" />
    }
  };

  const alertType = types[type] || types.info;

  return (
    <div className={`alert ${alertType.bg} shadow-lg`}>
      <div className="flex items-center gap-2">
        {alertType.icon}
        <span>{message}</span>
      </div>
      {onClose && (
        <button onClick={onClose} className="btn btn-sm btn-ghost">
          ✕
        </button>
      )}
    </div>
  );
};

export default Alert;
