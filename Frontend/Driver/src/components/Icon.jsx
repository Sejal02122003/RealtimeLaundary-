const ICONS = {
  truck: (
    <>
      <path d="M4.5 17H2.5V6h11v11h-5M13.5 9.5h4.3l3.7 3.7V17H19M13.5 17H15" />
      <circle cx="6.5" cy="17.5" r="2" />
      <circle cx="17" cy="17.5" r="2" />
    </>
  ),
  box: (
    <>
      <path d="M12 3l8.5 4.500v9L12 21l-8.500-4.500v-9z" />
      <path d="M3.500 7.500L12 12l8.500-4.500M12 12v9" />
    </>
  ),
  receipt: (
    <>
      <path d="M5.5 3h13v18l-2.2-1.4-2.1 1.4-2.2-1.4-2.2 1.4-2.1-1.4L5.5 21z" />
      <path d="M9 8h6M9 12h6" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20.5c0-4 3.4-6.5 7.5-6.5s7.5 2.5 7.5 6.5" />
    </>
  ),
  bell: (
    <>
      <path d="M6 9.5a6 6 0 0 1 12 0c0 5 2 6.5 2 6.5H4s2-1.5 2-6.5" />
      <path d="M10.2 19.5a2 2 0 0 0 3.6 0" />
    </>
  ),
  wallet: (
    <>
      <rect x="3" y="6" width="18" height="14" rx="3" />
      <path d="M6 6l9.5-2.5a1.5 1.5 0 0 1 1.9 1.4V6M16 13h.01" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21.5s-7-6-7-11.5a7 7 0 0 1 14 0c0 5.5-7 11.5-7 11.5z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  navigate: <path d="M20.5 3.5L3.5 10.5l7 3 3 7z" />,
  phone: (
    <path d="M5 3.5h3.5l1.7 4.5-2.2 1.6a12 12 0 0 0 6.4 6.4l1.6-2.2 4.5 1.7V19a1.5 1.5 0 0 1-1.6 1.5C10.4 20 4 13.6 3.5 5.1A1.5 1.5 0 0 1 5 3.5z" />
  ),
  camera: (
    <>
      <path d="M3 8.5A1.5 1.5 0 0 1 4.5 7H7l1.5-2.5h7L17 7h2.5A1.5 1.5 0 0 1 21 8.500V18a1.500 1.500 0 0 1-1.500 1.500h-15A1.500 1.500 0 0 1 3 18z" />
      <circle cx="12" cy="13" r="3.5" />
    </>
  ),
  file: (
    <>
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v4h4M9 12.5h6M9 16.5h6" />
    </>
  ),
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  back: <path d="M15 5l-7 7 7 7" />,
  chevron: <path d="M9 5l7 7-7 7" />,
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
