import type { SVGProps } from 'react';

const base: SVGProps<SVGSVGElement> = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

export const PlusIcon = () => (
  <svg {...base}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const LogoutIcon = () => (
  <svg {...base}>
    <path d="M10 5H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h4M15 8l4 4-4 4M9 12h10" />
  </svg>
);

export const BackIcon = () => (
  <svg {...base}>
    <path d="M15 5l-7 7 7 7" />
  </svg>
);

export const SendIcon = () => (
  <svg {...base} fill="currentColor" stroke="none">
    <path d="M3.4 20.4 21 12 3.4 3.6l-.01 6.5L15 12 3.39 13.9z" />
  </svg>
);
