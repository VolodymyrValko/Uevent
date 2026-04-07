import React from 'react';

interface UEventLogoProps {
  size?: number;
  className?: string;
}

const UEventLogo: React.FC<UEventLogoProps> = ({ size = 36, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 36 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="uevent logo"
  >
    <defs>
      <linearGradient id="uevent-grad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#ff6b85" />
        <stop offset="100%" stopColor="#be1840" />
      </linearGradient>
    </defs>

    <rect width="36" height="36" rx="9" fill="url(#uevent-grad)" />

    <path
      d="M9 10 L9 21 Q9 30 18 30 Q27 30 27 21 L27 10"
      stroke="white"
      strokeWidth="4.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    <path
      d="M18 2.5 L19.1 5.1 L21.8 6 L19.1 6.9 L18 9.5 L16.9 6.9 L14.2 6 L16.9 5.1Z"
      fill="white"
    />
  </svg>
);

export default UEventLogo;
