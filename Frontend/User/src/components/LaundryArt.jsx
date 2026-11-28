import { useId } from 'react'

/*
 * Animated artwork for the welcome screen. Every drawing shares the basket's
 * 320 × 300 canvas and colours. The motion lives in LaundryScene.css.
 */

const SPARKLE = 'M0-24C3-8 8-3 24 0 8 3 3 8 0 24-3 8-8 3-24 0-8-3-3-8 0-24z'

function Scene({ children }) {
  const id = useId()
  const fill = (name) => `url(#${id}${name})`

  return (
    <svg viewBox="0 0 320 300" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}cream`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#dedad5" />
          <stop offset="0.3" stopColor="#fdfcfa" />
          <stop offset="0.7" stopColor="#ece9e4" />
          <stop offset="1" stopColor="#c2bdb9" />
        </linearGradient>
        <linearGradient id={`${id}blue`} x1="0.2" y1="0" x2="0.75" y2="1">
          <stop offset="0" stopColor="#8fd0ff" />
          <stop offset="0.5" stopColor="#4a9cf0" />
          <stop offset="1" stopColor="#2266c4" />
        </linearGradient>
        <linearGradient id={`${id}metal`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f4f6f9" />
          <stop offset="1" stopColor="#9aa4b4" />
        </linearGradient>
        <radialGradient id={`${id}shadow`}>
          <stop offset="0" stopColor="#233152" stopOpacity="0.32" />
          <stop offset="1" stopColor="#233152" stopOpacity="0" />
        </radialGradient>
        <clipPath id={`${id}drum`}>
          <circle cx="160" cy="176" r="50" />
        </clipPath>
      </defs>
      <ellipse cx="160" cy="272" rx="125" ry="22" fill={fill('shadow')} />
      {children(fill)}
    </svg>
  )
}

function Sparkle({ x, y, size = 1, delay = 0 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${size})`}>
      <path className="art-twinkle" style={{ animationDelay: `${delay}s` }} d={SPARKLE} fill="#fff" />
    </g>
  )
}

function Bubble({ x, y, r, delay = 0 }) {
  return (
    <g className="art-bubble" style={{ animationDelay: `${delay}s` }}>
      <circle cx={x} cy={y} r={r} fill="#fff" fillOpacity="0.28" stroke="#fff" strokeWidth="2" />
      <circle cx={x - r * 0.32} cy={y - r * 0.32} r={r * 0.22} fill="#fff" />
    </g>
  )
}

export function WashingMachine() {
  return (
    <Scene>
      {(fill) => (
        <>
          <g fill="#8f8a88">
            <rect x="92" y="252" width="26" height="14" rx="5" />
            <rect x="202" y="252" width="26" height="14" rx="5" />
          </g>

          <g className="art-rumble">
            <rect x="74" y="46" width="172" height="214" rx="24" fill={fill('cream')} />
            <path d="M74 100h172" stroke="#cfcac5" strokeWidth="3" />
            <rect x="92" y="63" width="50" height="22" rx="7" fill="#1d3f7c" />
            <path d="M101 74h9m6 0h17" stroke="#8fd0ff" strokeWidth="4" strokeLinecap="round" />
            <circle cx="170" cy="74" r="6" fill="#c9c4bf" />
            <circle cx="214" cy="73" r="16" fill={fill('metal')} />
            <path d="M214 73l8-9" stroke="#4d5668" strokeWidth="4" strokeLinecap="round" />

            <circle cx="160" cy="176" r="68" fill={fill('metal')} />
            <circle cx="160" cy="176" r="56" fill="#33517f" />
            <circle cx="160" cy="176" r="50" fill="#12386f" />

            <g clipPath={fill('drum')}>
              <g className="art-spin">
                <circle cx="160" cy="176" r="50" fill="none" />
                <path
                  d="M126 160c8-22 38-24 48-8 8 13-4 26-20 22-14-4-34 2-28-14z"
                  fill={fill('blue')}
                />
                <path d="M172 188c18-10 34 4 26 18-8 13-34 14-38 2-3-9 3-15 12-20z" fill={fill('cream')} />
                <path d="M122 190c12-6 28 4 26 18-2 12-20 12-28 2-6-8-6-16 2-20z" fill="#ffc857" />
              </g>
              <path
                className="art-wave"
                d="M60 196q25-16 50 0t50 0 50 0 50 0 50 0v60H60z"
                fill="#7cc4ff"
                fillOpacity="0.55"
              />
            </g>

            <path
              d="M122 154c8-16 24-26 42-26"
              fill="none"
              stroke="#fff"
              strokeOpacity="0.55"
              strokeWidth="7"
              strokeLinecap="round"
            />
            <rect x="226" y="158" width="13" height="36" rx="6.5" fill={fill('cream')} />
          </g>

          <Bubble x={52} y={190} r={15} />
          <Bubble x={270} y={140} r={19} delay={-1.1} />
          <Bubble x={44} y={92} r={9} delay={-2.2} />
          <Bubble x={284} y={218} r={10} delay={-0.6} />
          <Sparkle x={278} y={62} size={0.9} />
        </>
      )}
    </Scene>
  )
}

export function SteamIron() {
  return (
    <Scene>
      {(fill) => (
        <>
          {/* Folded clothes underneath */}
          <rect x="48" y="232" width="224" height="34" rx="17" fill={fill('blue')} />
          <rect x="62" y="206" width="196" height="32" rx="16" fill={fill('cream')} />
          <path
            d="M70 251h180M82 224h156"
            stroke="#fff"
            strokeOpacity="0.45"
            strokeWidth="4"
            strokeLinecap="round"
          />

          <g className="art-glide">
            <path d="M52 202c10-34 54-66 112-70h78c12 0 18 8 20 20l8 50z" fill={fill('blue')} />
            <path
              d="M120 142c2-48 24-66 62-66h40c26 0 38 20 38 62h-30c0-26-6-34-20-34h-30c-18 0-28 12-30 36z"
              fill={fill('cream')}
            />
            <path d="M46 202h224v8q0 8-10 8H62q-18-1-16-16z" fill={fill('metal')} />
            <circle cx="206" cy="167" r="17" fill={fill('cream')} />
            <path d="M206 167V155" stroke="#2266c4" strokeWidth="4" strokeLinecap="round" />
            <path
              d="M92 176c18-18 40-28 66-31"
              fill="none"
              stroke="#fff"
              strokeOpacity="0.5"
              strokeWidth="7"
              strokeLinecap="round"
            />
          </g>

          <g fill="none" stroke="#fff" strokeWidth="9" strokeLinecap="round">
            <path className="art-steam" d="M62 164c-16-15 12-25-3-42" />
            <path
              className="art-steam"
              style={{ animationDelay: '-0.8s' }}
              d="M92 130c-16-17 14-29-2-50"
            />
            <path
              className="art-steam"
              style={{ animationDelay: '-1.6s' }}
              d="M34 138c-12-13 10-21-2-35"
            />
          </g>
          <Sparkle x={276} y={52} size={0.9} />
        </>
      )}
    </Scene>
  )
}

export function HangingShirt() {
  return (
    <Scene>
      {(fill) => (
        <>
          <g className="art-swing">
            <path
              d="M160 68V54c14-3 18-24 2-28-12-3-20 7-16 15"
              fill="none"
              stroke="#e8edf5"
              strokeWidth="7"
              strokeLinecap="round"
            />
            <path
              d="M160 66L84 106h152z"
              fill="none"
              stroke={fill('cream')}
              strokeWidth="10"
              strokeLinejoin="round"
            />
            <path
              d="M128 82l-48 20-36 62 34 20 20-30v94q0 12 12 12h100q12 0 12-12v-94l20 30 34-20-36-62-48-20q-32 26-64 0z"
              fill={fill('blue')}
              stroke={fill('blue')}
              strokeWidth="6"
              strokeLinejoin="round"
            />
            <path d="M128 80l32 26-24 18-20-36zM192 80l-32 26 24 18 20-36z" fill={fill('cream')} />
            <path d="M160 108v148" stroke="#1d5db6" strokeOpacity="0.45" strokeWidth="3" />
            <g fill="#fff">
              <circle cx="160" cy="138" r="5" />
              <circle cx="160" cy="171" r="5" />
              <circle cx="160" cy="204" r="5" />
              <circle cx="160" cy="237" r="5" />
            </g>
            <path
              d="M178 146h28v24q-14 11-28 0z"
              fill="none"
              stroke="#fff"
              strokeOpacity="0.65"
              strokeWidth="3.5"
              strokeLinejoin="round"
            />
            <path
              d="M98 112l-30 48M112 168v72"
              stroke="#fff"
              strokeOpacity="0.3"
              strokeWidth="7"
              strokeLinecap="round"
            />
          </g>
          <Sparkle x={272} y={72} />
          <Sparkle x={48} y={84} size={0.7} delay={-1} />
          <Sparkle x={266} y={226} size={0.55} delay={-1.8} />
        </>
      )}
    </Scene>
  )
}

export function DeliveryVan() {
  return (
    <Scene>
      {(fill) => (
        <>
          <g stroke="#fff" strokeWidth="7" strokeLinecap="round">
            <path className="art-speed" d="M10 128h38" />
            <path className="art-speed" style={{ animationDelay: '-0.45s' }} d="M4 166h26" />
            <path className="art-speed" style={{ animationDelay: '-0.9s' }} d="M16 204h32" />
          </g>

          <g className="art-drive">
            <rect x="52" y="86" width="164" height="144" rx="22" fill={fill('cream')} />
            <path d="M206 118h44q14 0 22 14l22 40q4 7 4 15v31q0 12-12 12h-80z" fill={fill('blue')} />
            <path d="M222 132h26q8 0 12 7l16 31h-54z" fill="#dcefff" />
            <path d="M229 141l-1 20" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
            <rect x="52" y="196" width="164" height="18" fill={fill('blue')} />
            <circle cx="134" cy="142" r="34" fill={fill('blue')} />
            {/* Folded clothes badge */}
            <g fill="#fff">
              <rect x="116" y="146" width="36" height="10" rx="5" />
              <rect x="119" y="133" width="30" height="10" rx="5" />
              <rect x="123" y="120" width="22" height="10" rx="5" />
            </g>
            <rect x="282" y="190" width="14" height="14" rx="5" fill="#ffd76a" />
          </g>

          {[104, 246].map((x) => (
            <g key={x}>
              <circle cx={x} cy="234" r="30" fill="#26324d" />
              <g className="art-spin" style={{ transformOrigin: `${x}px 234px` }}>
                <circle cx={x} cy="234" r="15" fill={fill('metal')} />
                <path
                  d={`M${x - 14} 234h28M${x} 220v28`}
                  stroke="#5b667d"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </g>
            </g>
          ))}
          <Sparkle x={274} y={64} size={0.9} />
        </>
      )}
    </Scene>
  )
}
