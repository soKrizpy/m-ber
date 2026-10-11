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
 * - Light Mode: Deep, rich forest/pine green (#23533E & #2D6A4F) for optimal contrast on clean white backgrounds.
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
        className="shrink-0 transition-transform duration-200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          {/* Light Mode Gradient */}
          <linearGradient id="mber-grad-light" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2D6A4F" />
            <stop offset="100%" stopColor="#1E4D38" />
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
          {/* Left Stem & Top Arch of 'M' */}
          <path
            d="M 105 340 L 105 105 C 105 65 145 52 175 82 L 250 162"
            stroke="currentColor"
            strokeWidth="24"
          />

          {/* Right Diagonal & Right Vertical Stem of 'M' */}
          <path
            d="M 250 162 L 325 82 C 355 52 395 65 395 105 L 395 340"
            stroke="currentColor"
            strokeWidth="24"
          />

          {/* House Roof Gable */}
          <path
            d="M 148 260 L 250 165 L 342 250"
            stroke="currentColor"
            strokeWidth="24"
          />

          {/* House Base Walls and Floor */}
          <path
            d="M 175 258 L 175 320 C 175 338 190 348 210 348 L 290 348 C 310 348 325 338 325 320 L 325 248"
            stroke="currentColor"
            strokeWidth="24"
          />

          {/* Chimney Shaft */}
          <path
            d="M 325 240 L 325 170"
            stroke="currentColor"
            strokeWidth="24"
          />

          {/* Upward Growth Arrowhead on Chimney */}
          <path
            d="M 298 174 L 325 136 L 352 174 Z"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="6"
          />

          {/* Arched Window (4 Panes) */}
          {/* Top-left pane (Arched top) */}
          <path
            d="M 222 252 L 222 238 C 222 228 228 224 238 224 L 241 224 L 241 252 Z"
            fill="currentColor"
          />
          {/* Top-right pane (Arched top) */}
          <path
            d="M 249 252 L 249 224 L 252 224 C 262 224 268 228 268 238 L 268 252 Z"
            fill="currentColor"
          />
          {/* Bottom-left pane */}
          <rect
            x="222"
            y="259"
            width="19"
            height="19"
            rx="3"
            fill="currentColor"
          />
          {/* Bottom-right pane */}
          <rect
            x="249"
            y="259"
            width="19"
            height="19"
            rx="3"
            fill="currentColor"
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
