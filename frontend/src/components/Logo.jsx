import React from 'react';
import { motion } from 'framer-motion';
import { FullLogo, LogoIcon } from './BrandLogos';

const Logo = ({ className = '', showText = true, size = 'md' }) => {
  return (
    <motion.div 
      className={`inline-flex items-center ${className}`}
      whileHover={{ scale: 1.02 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {showText ? (
        <FullLogo size={size} />
      ) : (
        <LogoIcon size={size === 'sm' ? 32 : size === 'lg' ? 64 : size === 'xl' ? 80 : 44} />
      )}
    </motion.div>
  );
};

export default Logo;
