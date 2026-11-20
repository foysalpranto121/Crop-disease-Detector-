/*
 * Lightweight SVG versions of the 3D scenes. Shown in Lite mode, on weak devices,
 * and while the 3D bundle is loading. CSS-only animation (disabled by reduced motion).
 */

export function HeroFallback() {
  const crops = Array.from({ length: 34 }, (_, i) => i);
  return (
    <svg viewBox="0 0 1440 800" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="hf-hill1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7cc77f" />
          <stop offset="1" stopColor="#3f9b4f" />
        </linearGradient>
        <linearGradient id="hf-hill2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4fae5c" />
          <stop offset="1" stopColor="#1f7a37" />
        </linearGradient>
        <radialGradient id="hf-sun">
          <stop offset="0" stopColor="#fff6c8" />
          <stop offset="0.5" stopColor="#ffe08a" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ffe08a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hf-leaf" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#1a8a3a" />
          <stop offset="1" stopColor="#55c46b" />
        </linearGradient>
      </defs>

      <circle cx="260" cy="190" r="150" fill="url(#hf-sun)" />
      <circle cx="260" cy="190" r="55" fill="#fff1b0" />

      <path d="M0 520 C 240 430 480 470 720 500 S 1200 430 1440 470 V800 H0Z" fill="url(#hf-hill1)" opacity="0.85" />
      <path d="M0 610 C 300 540 600 600 900 580 S 1300 540 1440 570 V800 H0Z" fill="url(#hf-hill2)" />

      {crops.map((i) => {
        const x = 20 + i * 43;
        const y = 640 + Math.sin(i * 0.7) * 10;
        return (
          <g key={i} transform={`translate(${x} ${y})`}>
            <g className="animate-sway" style={{ transformOrigin: "0px 0px", animationDelay: `${-(i % 7) * 0.5}s` }}>
              <path d="M0 0 C -4 -30 -2 -55 0 -70 C 2 -55 4 -30 0 0Z" fill={i % 5 === 0 ? "#d9c065" : "#2f9e47"} />
              <path d="M0 -20 C -14 -32 -20 -44 -22 -54 C -10 -46 -3 -36 0 -24Z" fill="#46b85c" />
              <path d="M0 -32 C 14 -42 20 -52 22 -62 C 10 -56 3 -46 0 -36Z" fill="#46b85c" />
            </g>
          </g>
        );
      })}

      {/* Floating leaf with scanning line */}
      <g transform="translate(1080 330)">
        <g className="animate-float" style={{ transformOrigin: "0px 0px" }}>
          <path d="M0 150 C -110 90 -110 -60 0 -150 C 110 -60 110 90 0 150Z" fill="url(#hf-leaf)" />
          <path d="M0 150 L0 -140" stroke="#146C2E" strokeWidth="5" />
          {[-90, -40, 10, 60].map((y) => (
            <g key={y}>
              <path d={`M0 ${y + 30} L-55 ${y}`} stroke="#146C2E" strokeWidth="3" opacity="0.6" />
              <path d={`M0 ${y + 30} L55 ${y}`} stroke="#146C2E" strokeWidth="3" opacity="0.6" />
            </g>
          ))}
          <circle cx="-35" cy="-40" r="14" fill="#7A4E2D" opacity="0.8" />
          <circle cx="30" cy="20" r="18" fill="#7A4E2D" opacity="0.8" />
          <circle cx="-20" cy="70" r="11" fill="#7A4E2D" opacity="0.8" />
          <rect x="-110" y="-4" width="220" height="6" rx="3" fill="#8EDB8F" opacity="0.9">
            <animate attributeName="y" values="-150;140;-150" dur="4s" repeatCount="indefinite" />
          </rect>
        </g>
      </g>
    </svg>
  );
}

export function GlobeFallback() {
  return (
    <svg viewBox="0 0 400 400" className="h-full w-full" aria-hidden>
      <defs>
        <radialGradient id="gf-globe" cx="0.35" cy="0.35">
          <stop offset="0" stopColor="#22A447" />
          <stop offset="1" stopColor="#0B3D1F" />
        </radialGradient>
      </defs>
      <circle cx="200" cy="200" r="170" fill="url(#gf-globe)" />
      {[0.25, 0.5, 0.75].map((k) => (
        <ellipse key={k} cx="200" cy="200" rx={170 * k} ry="170" fill="none" stroke="#8EDB8F" strokeOpacity="0.3" />
      ))}
      {[-110, -55, 0, 55, 110].map((dy) => (
        <ellipse key={dy} cx="200" cy={200 + dy} rx={Math.sqrt(170 * 170 - dy * dy)} ry="14" fill="none" stroke="#8EDB8F" strokeOpacity="0.3" />
      ))}
      {[
        [110, 150],
        [300, 130],
        [280, 280],
        [120, 290],
      ].map(([x, y]) => (
        <path key={`${x}-${y}`} d={`M250 175 Q ${(250 + x) / 2} ${Math.min(175, y) - 60} ${x} ${y}`} stroke="#E9C46A" strokeWidth="2" fill="none" strokeDasharray="4 4" />
      ))}
      <circle cx="250" cy="175" r="16" fill="#8EDB8F" opacity="0.4">
        <animate attributeName="r" values="8;26;8" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="250" cy="175" r="7" fill="#E9C46A" stroke="#fff" strokeWidth="2" />
    </svg>
  );
}
