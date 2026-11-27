const ICONS = {
  truck: (
    <>
      <path d="M2.5 6h11v11h-11z" />
      <path d="M13.5 9.500h4.300l3.7 3.700V17h-8" />
      <circle cx="6.500" cy="17.500" r="2" fill="var(--mint)" />
      <circle cx="17" cy="17.500" r="2" fill="var(--mint)" />
    </>
  ),
  back: <path d="M15 5l-7 7 7 7" />,
}

export default function Icon({ name, size = 22, strokeWidth = 2 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONS[name]}
    </svg>
  )
}
