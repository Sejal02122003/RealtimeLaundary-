const ICONS = {
  bell: (
    <>
      <path d="M6 9.5a6 6 0 0 1 12 0c0 5 2 6.5 2 6.5H4s2-1.5 2-6.5" />
      <path d="M10.2 19.5a2 2 0 0 0 3.6 0" />
    </>
  ),
  washer: (
    <>
      <rect x="4" y="2.5" width="16" height="19" rx="3" />
      <circle cx="12" cy="13" r="4.5" />
      <path d="M7.5 6h.01" />
    </>
  ),
  hanger: (
    <path d="M9.5 6.5a2.5 2.5 0 1 1 3.7 2.2c-.8.45-1.2 1-1.2 1.9v.4l8.4 5.6c1 .7.5 2.2-.7 2.2H4.300c-1.2 0-1.7-1.5-.7-2.2L12 11" />
  ),
  iron: (
    <>
      <path d="M3 17.5c0-4.4 3.6-8 8-8h8.5l1.5 8z" />
      <path d="M8 6h8.5a2.5 2.5 0 0 1 2.5 2.5v1" />
    </>
  ),
  star: <path d="M12 3l2.700 5.600 6.1.8-4.500 4.300 1.1 6.1L12 16.9l-5.400 2.900 1.100-6.100-4.500-4.3 6.1-.8z" />,
  home: (
    <>
      <path d="M3.5 10.5L12 3.5l8.5 7V19a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19z" />
      <path d="M9.5 20.5v-6h5v6" />
    </>
  ),
  receipt: (
    <>
      <path d="M5.5 3h13v18l-2.2-1.4-2.1 1.4-2.2-1.4-2.2 1.4-2.1-1.4L5.500 21z" />
      <path d="M9 8h6M9 12h6" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
      <path d="M16 4.8a3.5 3.5 0 0 1 0 6.4M18 14.5c2.1.8 3.5 2.8 3.5 5.5" />
    </>
  ),
  wallet: (
    <>
      <rect x="3" y="6" width="18" height="14" rx="3" />
      <path d="M6 6l9.5-2.5a1.5 1.5 0 0 1 1.9 1.4V6M16 13h.01" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20.5c0-4 3.4-6.5 7.5-6.5s7.5 2.5 7.5 6.5" />
    </>
  ),
  back: <path d="M15 5l-7 7 7 7" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  pin: (
    <>
      <path d="M12 21.5s-7-6-7-11.5a7 7 0 0 1 14 0c0 5.500-7 11.5-7 11.5z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  phone: (
    <path d="M5 3.5h3.5l1.700 4.5-2.200 1.600a12 12 0 0 0 6.400 6.400l1.600-2.200 4.500 1.7V19a1.500 1.500 0 0 1-1.6 1.500C10.4 20 4 13.600 3.5 5.100A1.500 1.5 0 0 1 5 3.500z" />
  ),
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
