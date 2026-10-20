import './Logo.css';
import { Link } from 'react-router-dom';

/**
 * Original Geometric Nexo Nexus Icon
 * Inspired by modern fintech & tech academy geometry (interlocking faceted isometric N-monogram)
 * Unique, proprietary design with 180° rotational symmetry and dimensional facets.
 */
export const LogoIcon = ({ className = 'logo-logo-icon-class-name' }) => {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        {/* Primary Electric Cobalt to Azure Gradient */}
        <linearGradient
          id="nexo-grad-main"
          x1="12"
          y1="12"
          x2="52"
          y2="52"
          gradientUnits="userSpaceOnUse"
        >
          <stop
            offset="0%"
            stopColor="#38bdf8"
          />
          <stop
            offset="35%"
            stopColor="#2563eb"
          />
          <stop
            offset="100%"
            stopColor="#1e3a8a"
          />
        </linearGradient>

        {/* Top/Light Bevel Gradient (High-light reflections) */}
        <linearGradient
          id="nexo-grad-light"
          x1="12"
          y1="14"
          x2="32"
          y2="28"
          gradientUnits="userSpaceOnUse"
        >
          <stop
            offset="0%"
            stopColor="#bae6fd"
          />
          <stop
            offset="60%"
            stopColor="#38bdf8"
          />
          <stop
            offset="100%"
            stopColor="#2563eb"
          />
        </linearGradient>

        {/* Deep Shadow / Underside Facet Gradient */}
        <linearGradient
          id="nexo-grad-dark"
          x1="32"
          y1="36"
          x2="52"
          y2="50"
          gradientUnits="userSpaceOnUse"
        >
          <stop
            offset="0%"
            stopColor="#1d4ed8"
          />
          <stop
            offset="70%"
            stopColor="#172554"
          />
          <stop
            offset="100%"
            stopColor="#0f172a"
          />
        </linearGradient>

        {/* Subtle Ambient Glow filter */}
        <filter
          id="nexo-glow"
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
        >
          <feDropShadow
            dx="0"
            dy="2"
            stdDeviation="3"
            floodColor="#2563eb"
            floodOpacity="0.35"
          />
        </filter>
      </defs>

      {/* Main Interlocking N Monogram */}
      <g filter="url(#nexo-glow)">
        {/* Left Vertical Pillar - Front Face */}
        <path
          d="M12 50V21.5L21.5 14V42.5L12 50Z"
          fill="url(#nexo-grad-main)"
        />

        {/* Left Top Bevel / Apex Cap */}
        <path
          d="M12 21.5L21.5 14L30.5 21L21 28.5L12 21.5Z"
          fill="url(#nexo-grad-light)"
        />

        {/* Dynamic Nexus Diagonal Ribbon (Spanning Upper-Left to Lower-Right) */}
        <path
          d="M21 28.5L30.5 21L43 42.5L33.5 50L21 28.5Z"
          fill="url(#nexo-grad-main)"
        />

        {/* Right Vertical Pillar - Front Face */}
        <path
          d="M42.5 21.5V50L33 42.5V14L42.5 21.5Z"
          fill="url(#nexo-grad-light)"
        />

        {/* Right Bottom Bevel / Core Connector */}
        <path
          d="M42.5 21.5L52 14V42.5L42.5 50V21.5Z"
          fill="url(#nexo-grad-dark)"
        />

        {/* Central Diamond Nexus Core (Illuminated Focal Point) */}
        <polygon
          points="31.8,29.5 36.5,35.5 31.8,41.5 27.1,35.5"
          fill="#38bdf8"
          opacity="0.85"
        />

        {/* Micro Light Specular Accent */}
        <circle
          cx="31.8"
          cy="35.5"
          r="1.5"
          fill="#ffffff"
        />
      </g>
    </svg>
  );
};

/**
 * Complete NEXO Logo (Icon + Bespoke Modern Wordmark)
 */
export const Logo = ({ size = 'md', showText = true, to, className = '', iconOnly = false }) => {
  const sizeMap = {
    sm: {
      iconSize: 'logo-size-map-icon-size',
      textSize: 'logo-size-map-text-size',
      dotSize: 'logo-size-map-dot-size',
    },
    md: {
      iconSize: 'logo-size-map-icon-size-2',
      textSize: 'logo-size-map-text-size-2',
      dotSize: 'logo-size-map-dot-size-2',
    },
    lg: {
      iconSize: 'logo-size-map-icon-size-3',
      textSize: 'logo-size-map-text-size-3',
      dotSize: 'logo-size-map-dot-size-3',
    },
    xl: {
      iconSize: 'logo-size-map-icon-size-4',
      textSize: 'logo-size-map-text-size-4',
      dotSize: 'logo-size-map-dot-size-4',
    },
  };
  const { iconSize, textSize, dotSize } = sizeMap[size] || sizeMap.md;
  const content = (
    <div className={`logo-panel ${className}`}>
      <LogoIcon className={`${iconSize} logo-logo-icon`} />
      {showText && !iconOnly && (
        <div className="logo-panel-2">
          <span className={`logo-label ${textSize} logo-label-2`}>NEXO</span>
          <span className={`${dotSize} logo-label-3`} />
        </div>
      )}
    </div>
  );
  if (to) {
    return (
      <Link
        to={to}
        className="logo-link ui-group"
      >
        {content}
      </Link>
    );
  }

  return content;
};

export default Logo;
