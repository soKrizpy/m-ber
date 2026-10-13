import React from 'react';

export interface MBerLogoProps {
  variant?: 'full' | 'horizontal' | 'icon';
  isDark?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | number;
  className?: string;
  showSubtitle?: boolean;
  subtitle?: string;
  badge?: string;
}

/**
 * M-Ber Official Brand Logo Component
 * Expertly adjusted for Light and Dark modes:
 * - Light Mode: Deep, rich forest/pine green (#23533E & #1B4332) for optimal contrast on clean white backgrounds.
 * - Dark Mode: Luminous emerald (#10B981 & #34D399) with radiant mint accents and crisp white wordmark (#FFFFFF) for dark backgrounds.
 */
export const MBerLogo: React.FC<MBerLogoProps> = ({
  variant = 'horizontal',
  isDark,
  size = 'md',
  className = '',
  showSubtitle = false,
  subtitle = 'Monthly Budget Report',
  badge,
}) => {
  // Dimension mapping
  const sizeMap: Record<string, { iconSize: number; textSize: string; subSize: string; gap: string }> = {
    xs: { iconSize: 24, textSize: 'text-sm font-extrabold', subSize: 'text-[9px]', gap: 'gap-1.5' },
    sm: { iconSize: 32, textSize: 'text-base font-extrabold', subSize: 'text-[10px]', gap: 'gap-2' },
    md: { iconSize: 42, textSize: 'text-lg font-black', subSize: 'text-[11px]', gap: 'gap-2.5' },
    lg: { iconSize: 56, textSize: 'text-xl font-black', subSize: 'text-xs', gap: 'gap-3' },
    xl: { iconSize: 80, textSize: 'text-2xl font-black', subSize: 'text-sm', gap: 'gap-3.5' },
    '2xl': { iconSize: 120, textSize: 'text-4xl font-black', subSize: 'text-base', gap: 'gap-4' },
  };

  const currentSize = typeof size === 'number'
    ? { iconSize: size, textSize: 'text-lg font-black', subSize: 'text-xs', gap: 'gap-2' }
    : sizeMap[size] || sizeMap.md;

  // Vector Icon Graphic representing the official M-Ber Emblem
  const renderIconMark = (dim: number) => {
    return (
      <svg
        viewBox="0 0 500 500"
        width={dim}
        height={dim}
        className="shrink-0 transition-transform duration-200 select-none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          {/* Light Mode Gradient */}
          <linearGradient id="mber-grad-light" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#23533E" />
            <stop offset="100%" stopColor="#1B4332" />
          </linearGradient>
          <linearGradient id="mber-arrow-light" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#2D6A4F" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>

          {/* Dark Mode Gradient */}
          <linearGradient id="mber-grad-dark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>
          <linearGradient id="mber-arrow-dark" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#6EE7B7" />
          </linearGradient>
        </defs>

        {/* Dynamic theme stroke color class if isDark is undefined (CSS class based), or explicit */}
        <g
          strokeLinecap="round"
          strokeLinejoin="round"
          className={
            isDark === true
              ? 'text-emerald-400'
              : isDark === false
              ? 'text-emerald-800'
              : 'text-emerald-800 dark:text-emerald-400'
          }
        >
          {/* Left vertical leg & top arch into roof */}
          <path
            d="M 90 410 L 90 152 C 90 92 144 76 180 112 L 250 182"
            stroke="currentColor"
            strokeWidth="26"
          />

          {/* Right diagonal into top arch & right vertical leg */}
          <path
            d="M 250 182 L 320 112 C 356 76 410 92 410 152 L 410 410"
            stroke="currentColor"
            strokeWidth="26"
          />

          {/* Gable roof of the house (45° Symmetrical Pitch) */}
          <path
            d="M 145 320 L 250 215 L 355 320"
            stroke="currentColor"
            strokeWidth="26"
          />

          {/* House base walls and bottom continuous curved floor */}
          <path
            d="M 175 298 L 175 385 C 175 409 194 418 222 418 L 278 418 C 306 418 325 409 325 385 L 325 295"
            stroke="currentColor"
            strokeWidth="26"
          />

          {/* Chimney vertical shaft */}
          <path
            d="M 325 285 L 325 218"
            stroke="currentColor"
            strokeWidth="24"
          />

          {/* Upward arrow growth pointer on top of chimney */}
          <path
            d="M 298 220 L 325 174 L 352 220 Z"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="5"
          />

          {/* 4-Pane Arched Center Window */}
          {/* Top-left pane (arched top-left) */}
          <path
            d="M 223 310 L 223 296 C 223 288 230 284 243 284 L 244 284 L 244 310 Z"
            fill="currentColor"
            stroke="none"
          />
          {/* Top-right pane (arched top-right) */}
          <path
            d="M 256 310 L 256 284 L 257 284 C 270 284 277 288 277 296 L 277 310 Z"
            fill="currentColor"
            stroke="none"
          />
          {/* Bottom-left pane */}
          <rect
            x="223"
            y="316"
            width="21"
            height="21"
            rx="3.5"
            fill="currentColor"
            stroke="none"
          />
          {/* Bottom-right pane */}
          <rect
            x="256"
            y="316"
            width="21"
            height="21"
            rx="3.5"
            fill="currentColor"
            stroke="none"
          />
        </g>
      </svg>
    );
  };

  // If Icon-only variant
  if (variant === 'icon') {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        {renderIconMark(currentSize.iconSize)}
      </div>
    );
  }

  // If Full stacked variant (Icon on top, Wordmark below)
  if (variant === 'full') {
    return (
      <div className={`inline-flex flex-col items-center text-center ${currentSize.gap} ${className}`}>
        {renderIconMark(currentSize.iconSize)}
        <div>
          <span
            className={`tracking-tight ${currentSize.textSize} ${
              isDark === true
                ? 'text-white'
                : isDark === false
                ? 'text-slate-900'
                : 'text-slate-900 dark:text-white'
            }`}
          >
            M-Ber
          </span>
          {showSubtitle && (
            <p
              className={`font-medium ${currentSize.subSize} ${
                isDark === true
                  ? 'text-slate-400'
                  : isDark === false
                  ? 'text-slate-500'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Horizontal variant (Icon on left, Typography on right)
  return (
    <div className={`inline-flex items-center ${currentSize.gap} select-none ${className}`}>
      {renderIconMark(currentSize.iconSize)}
      <div className="flex flex-col justify-center leading-tight">
        <div className="flex items-center gap-1.5">
          <span
            className={`tracking-tight ${currentSize.textSize} ${
              isDark === true
                ? 'text-white'
                : isDark === false
                ? 'text-slate-900'
                : 'text-slate-900 dark:text-white'
            }`}
          >
            M-Ber
          </span>
          {badge && (
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
              {badge}
            </span>
          )}
        </div>
        {showSubtitle && (
          <p
            className={`font-medium ${currentSize.subSize} ${
              isDark === true
                ? 'text-slate-400'
                : isDark === false
                ? 'text-slate-500'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};
