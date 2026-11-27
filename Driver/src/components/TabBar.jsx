import { Link, useRouter } from '../router.jsx'

const TABS = [
  { label: 'Jobs', path: '/jobs' },
  { label: 'History', path: '/history' },
  { label: 'Profile', path: '/profile' },
]

// The profile screen has its own back button and save bar, so no tabs there.
export const TAB_PATHS = ['/jobs', '/history']

export default function TabBar() {
  const { pathname } = useRouter()

  return (
    <nav className="tabbar" aria-label="Main">
      {TABS.map((tab) => (
        <Link
          key={tab.path}
          to={tab.path}
          transition={tab.path === '/profile' ? 'forward' : 'fade'}
          aria-current={pathname === tab.path ? 'page' : undefined}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  )
}
