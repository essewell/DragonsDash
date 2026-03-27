interface DragonLogoProps {
  size?: number;
  className?: string;
}

export function DragonLogo({ size = 32, className }: DragonLogoProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="DragonsDash logo"
    >
      <rect width="32" height="32" rx="4" fill="#0A192F" />
      {/* Geometric dragon wing pattern */}
      <path
        d="M8 10L16 6L24 10V18L16 26L8 18V10Z"
        stroke="#CC5500"
        strokeWidth="1.5"
        fill="none"
      />
      {/* Inner cross lines */}
      <path d="M16 6V26" stroke="#CC5500" strokeWidth="1" opacity="0.4" />
      <path d="M8 10L24 18" stroke="#CC5500" strokeWidth="1" opacity="0.4" />
      <path d="M24 10L8 18" stroke="#CC5500" strokeWidth="1" opacity="0.4" />
      {/* Center eye */}
      <circle cx="16" cy="16" r="3" fill="#CC5500" />
      {/* Wing tips */}
      <path
        d="M12 12L16 8L20 12"
        stroke="#CC5500"
        strokeWidth="1"
        opacity="0.6"
      />
      <path
        d="M12 20L16 24L20 20"
        stroke="#CC5500"
        strokeWidth="1"
        opacity="0.6"
      />
    </svg>
  );
}
