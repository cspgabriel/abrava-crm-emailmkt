import React, { useState } from 'react';

type BrandLogoProps = {
  className?: string;
  wordmarkClassName?: string;
  subtitleClassName?: string;
  iconClassName?: string;
  compact?: boolean;
};

// PNG locally generated with transparent background
const BRAND_LOGO_URL = '/logo_abravacon_transparent.png';

const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  iconClassName = '',
  compact = false,
}) => {
  const [logoLoaded, setLogoLoaded] = useState(true);

  const heightClass = compact ? 'h-14 sm:h-16' : 'h-20 sm:h-[6.5rem]';

  return (
    <div className={`flex items-center gap-3 ${className}`.trim()}>
      {logoLoaded ? (
        <img
          src={BRAND_LOGO_URL}
          alt="Abravacon"
          className={`${heightClass} w-auto object-contain ${iconClassName}`.trim()}
          onError={() => setLogoLoaded(false)}
        />
      ) : (
        <div className={`${heightClass} w-48 rounded-xl bg-slate-800/50 animate-pulse`} />
      )}
    </div>
  );
};

export default BrandLogo;
