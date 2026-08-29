import { motion } from 'framer-motion';
import clsx from 'clsx';

export const Card = ({ className, children, ...props }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className={clsx(
      'bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow duration-300',
      className
    )}
    {...props}
  >
    {children}
  </motion.div>
);

export const Button = ({ 
  variant = 'primary', 
  size = 'md', 
  loading = false, 
  children,
  className,
  ...props 
}) => {
  const baseClasses = 'font-medium rounded-lg transition-all duration-200 inline-flex items-center gap-2';
  
  const variants = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 shadow-md hover:shadow-lg',
    alert: 'bg-alert-600 text-white hover:bg-alert-700 shadow-md hover:shadow-lg',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-700',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={clsx(baseClasses, variants[variant], sizes[size], className)}
      disabled={loading}
      {...props}
    >
      {loading && <span className="animate-spin">⏳</span>}
      {children}
    </button>
  );
};

export const Badge = ({ variant = 'primary', children, className }) => {
  const variants = {
    primary: 'bg-primary-100 text-primary-800',
    alert: 'bg-alert-100 text-alert-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
  };

  return (
    <span className={clsx('px-3 py-1 rounded-full text-sm font-medium', variants[variant], className)}>
      {children}
    </span>
  );
};

export const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {title && <h2 className="text-xl font-bold mb-4">{title}</h2>}
        {children}
      </motion.div>
    </motion.div>
  );
};

export const LoadingSkeleton = ({ count = 1 }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="card animate-pulse">
        <div className="h-4 bg-gray-300 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-300 rounded w-1/2"></div>
      </div>
    ))}
  </>
);

export const EmptyState = ({ icon = '📭', title, description }) => (
  <div className="flex flex-col items-center justify-center py-12">
    <div className="text-6xl mb-4">{icon}</div>
    <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600 text-center">{description}</p>
  </div>
);

export default {
  Card,
  Button,
  Badge,
  Modal,
  LoadingSkeleton,
  EmptyState,
};
