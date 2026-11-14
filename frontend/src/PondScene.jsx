
function PondScene({ idPrefix = 'pond' }) {
  const gradientId = `${idPrefix}-water-gradient`

  return (
    <div className="pond-scene" aria-label="Decorative pond">
      <svg
        viewBox="0 0 900 220"
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid slice"
        role="img"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#DCE9D9" />
            <stop offset="100%" stopColor="#A8C5B0" />
          </linearGradient>
        </defs>

        <rect
          width="900"
          height="220"
          rx="24"
          fill={`url(#${gradientId})`}
        />

        <path
          d="M0 125 Q150 95 300 130 T600 125 T900 115 V220 H0Z"
          fill="#8EAF9A"
          opacity=".35"
        />

        <g fill="none" stroke="#FFFFFF" strokeWidth="2" opacity=".45">
          <ellipse cx="180" cy="145" rx="75" ry="12" />
          <ellipse cx="700" cy="75" rx="90" ry="15" />
          <ellipse cx="470" cy="185" rx="110" ry="10" />
        </g>

        <g transform="translate(450 115)">
          <ellipse cx="0" cy="22" rx="65" ry="17" fill="#547C63" />
          <path
            d="M0 20 C-45 -8 -48 -48 -22 -68 C-12 -35 -5 -8 0 20Z"
            fill="#678E70"
          />
          <path
            d="M0 20 C45 -8 48 -48 22 -68 C12 -35 5 -8 0 20Z"
            fill="#7FA783"
          />
          <path
            d="M0 18 C-14 -15 -8 -48 0 -62 C12 -35 14 -10 0 18Z"
            fill="#A7B99A"
          />
          <circle cx="0" cy="15" r="9" fill="#D69AA6" />
        </g>

        <g fill="#FFFFFF" opacity=".65">
          <circle cx="120" cy="65" r="3" />
          <circle cx="780" cy="155" r="4" />
          <circle cx="330" cy="45" r="2" />
          <circle cx="590" cy="170" r="3" />
        </g>
      </svg>
    </div>
  )
}

export default PondScene
