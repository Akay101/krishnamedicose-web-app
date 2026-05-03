import React from 'react';

export const LogoIcon = ({ size = 40, className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 100 100" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <linearGradient id="brandGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#2DD4BF" />
        <stop offset="100%" stopColor="#0D9488" />
      </linearGradient>
      <filter id="textShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="1" result="blur" />
        <feOffset dx="0.5" dy="0.5" result="offsetblur" />
        <feComponentTransfer>
          <feFuncA type="linear" slope="0.3" />
        </feComponentTransfer>
        <feMerge>
          <feMergeNode />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    {/* The Iconic Plus Shape */}
    <g stroke="#042f2e" strokeWidth="3.5" strokeLinejoin="round">
      <rect x="38" y="10" width="24" height="80" rx="12" fill="url(#brandGradient)" />
      <rect x="10" y="38" width="80" height="24" rx="12" fill="url(#brandGradient)" />
    </g>

    {/* The KM Initials - Clean, Bold, and Beautiful */}
    <text 
      x="50" 
      y="55" 
      textAnchor="middle" 
      fill="#042f2e" 
      fontSize="24" 
      fontWeight="900" 
      fontFamily="'Outfit', 'Inter', sans-serif"
      filter="url(#textShadow)"
      style={{ letterSpacing: '-0.05em' }}
    >
      KM
    </text>
  </svg>
);

export const FullLogo = ({ size = "md", className = "" }) => {
  const sizes = {
    sm: { text: 'text-2xl' },
    md: { text: 'text-4xl' },
    lg: { text: 'text-6xl' },
    xl: { text: 'text-7xl' }
  };
  const s = sizes[size] || sizes.md;

  return (
    <div className={`flex items-center ${className}`}>
      <div className={`${s.text} font-black font-outfit tracking-tighter flex items-center leading-none`}>
        <span className="text-white uppercase">KRISHNA</span>
        <span className="text-primary ml-2 uppercase italic">MEDICOSE</span>
      </div>
    </div>
  );
};
