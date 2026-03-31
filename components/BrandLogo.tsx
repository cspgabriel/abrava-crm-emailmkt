import React, { useState } from 'react';

type BrandLogoProps = {
  className?: string;
  wordmarkClassName?: string;
  subtitleClassName?: string;
  iconClassName?: string;
  compact?: boolean;
};

// Prefer local logo first, then try externally hosted logo
const LOCAL_LOGO = '/logo.png';
const BRAND_LOGO_URL = 'https://gcdnb.pbrd.co/images/b2tTs3cm8rnE.png?o=1';

// Primary BrandLogo component (below) is exported as default.
// The simpler center-only layout was removed to avoid duplicate exports.

const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  iconClassName = '',
  compact = false,
}) => {
  const [logoLoaded, setLogoLoaded] = useState(true);
  const [triedExternal, setTriedExternal] = useState(false);

  const heightClass = compact ? 'h-14 sm:h-16' : 'h-20 sm:h-[6.5rem]';

  return (
    <div className={`flex items-center gap-3 ${className}`.trim()}>
      {logoLoaded ? (
        <img
          src={LOCAL_LOGO}
          alt="Abravacon"
          className={`${heightClass} w-auto object-contain ${iconClassName}`.trim()}
          onError={(e) => {
            if (!triedExternal) {
              // try external URL if local asset failed to load
              setTriedExternal(true);
              (e.target as HTMLImageElement).src = BRAND_LOGO_URL;
            } else {
              setLogoLoaded(false);
            }
          }}
        />
      ) : (
        <div className={`${heightClass} w-48 rounded-xl bg-slate-800/50 animate-pulse`} />
      )}
    </div>
  );
};

export default BrandLogo;
