type EmblemProps = {
  className?: string;
  decorative?: boolean;
};

const TICKS = Array.from({ length: 72 }, (_, index) => index * 5);
const CARDINALS = [0, 90, 180, 270];

export function Emblem({ className, decorative = false }: EmblemProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      fill="none"
      role={decorative ? 'presentation' : 'img'}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : 'The Bramwell mark: an engraved circular seal with a serif B at its centre.'}
    >
      <g stroke="currentColor">
        <circle cx="100" cy="100" r="97" strokeWidth="0.4" opacity="0.28" />
        <circle cx="100" cy="100" r="90" strokeWidth="0.6" opacity="0.55" />
        <g className="emblem-turn">
          {TICKS.map((degrees, index) => (
            <line
              key={degrees}
              x1="100"
              y1="13"
              x2="100"
              y2={index % 6 === 0 ? 26 : 19}
              strokeWidth={index % 6 === 0 ? 0.8 : 0.4}
              opacity={index % 6 === 0 ? 0.72 : 0.38}
              transform={`rotate(${degrees} 100 100)`}
            />
          ))}
        </g>
        <circle cx="100" cy="100" r="70" strokeWidth="0.4" opacity="0.3" />
        <circle cx="100" cy="100" r="62" strokeWidth="0.6" opacity="0.5" />
        {CARDINALS.map((angle) => (
          <rect
            key={angle}
            x="98"
            y="30"
            width="4"
            height="4"
            strokeWidth="0.6"
            opacity="0.8"
            transform={`rotate(${angle} 100 100) rotate(45 100 32)`}
          />
        ))}
      </g>
      <text
        x="100"
        y="118"
        textAnchor="middle"
        fontFamily="'Cormorant Garamond', Georgia, serif"
        fontSize="58"
        fill="currentColor"
        opacity="0.92"
      >
        B
      </text>
      <rect x="97" y="130" width="6" height="6" fill="currentColor" opacity="0.75" transform="rotate(45 100 133)" />
    </svg>
  );
}
