const COLS = 22;
const ROWS = 44;
const SPACING = 9;
const OFFSET = 2;

const CONTINENT = `
  M 100,5
  Q 130,5 135,20
  Q 140,38 134,52
  Q 138,60 132,65
  Q 126,68 123,75
  Q 120,85 122,92
  Q 132,88 148,90
  Q 168,88 178,95
  Q 188,105 190,120
  Q 194,142 196,162
  Q 194,182 184,200
  Q 172,222 162,248
  Q 150,272 140,298
  Q 130,325 118,355
  Q 110,380 98,388
  Q 86,392 78,378
  Q 68,348 62,310
  Q 58,272 60,235
  Q 64,200 72,175
  Q 80,155 86,138
  Q 92,118 100,105
  Q 106,95 110,85
  Q 112,72 108,58
  Q 105,40 100,25
  Q 98,12 100,5
  Z
`;

const cities = [
  { x: 108, y: 42 },
  { x: 108, y: 100 },
  { x: 70, y: 192 },
  { x: 170, y: 155 },
  { x: 160, y: 235 },
  { x: 68, y: 290 },
  { x: 122, y: 312 },
];

export function LatamMap({ className }: { className?: string }) {
  const dots: { x: number; y: number }[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      dots.push({ x: OFFSET + c * SPACING, y: OFFSET + r * SPACING });
    }
  }

  return (
    <svg
      viewBox="0 0 200 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <clipPath id="latam-clip">
          <path d={CONTINENT} />
        </clipPath>
        <radialGradient id="city-pulse" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.6" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Background dots — full grid, very faint */}
      <g>
        {dots.map((d, i) => (
          <circle
            key={`bg-${i}`}
            cx={d.x}
            cy={d.y}
            r="0.8"
            fill="currentColor"
            fillOpacity="0.06"
          />
        ))}
      </g>

      {/* Continent dots — clipped to LATAM outline */}
      <g clipPath="url(#latam-clip)">
        {dots.map((d, i) => (
          <circle
            key={`land-${i}`}
            cx={d.x}
            cy={d.y}
            r="1.2"
            fill="currentColor"
            fillOpacity="0.2"
          />
        ))}
      </g>

      {/* City markers — animated pulse */}
      {cities.map((city, i) => (
        <g key={`city-${i}`}>
          <circle cx={city.x} cy={city.y} r="10" fill="url(#city-pulse)">
            <animate
              attributeName="r"
              values="6;12;6"
              dur={`${3 + i * 0.4}s`}
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="1;0.4;1"
              dur={`${3 + i * 0.4}s`}
              repeatCount="indefinite"
            />
          </circle>
          <circle
            cx={city.x}
            cy={city.y}
            r="1.8"
            fill="currentColor"
            fillOpacity="0.45"
          />
        </g>
      ))}
    </svg>
  );
}
