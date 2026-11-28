import { Link, useRouter } from '../routes/router.jsx'
import { useSession } from '../context/session.jsx'

const LINKS = [
  ['/dashboard', 'Dashboard'],
  ['/orders', 'Orders'],
  ['/customers', 'Customers'],
  ['/drivers', 'Drivers'],
  ['/services', 'Services & pricing'],
  ['/referrals', 'Referral network'],
  ['/finance', 'Finance & payouts'],
  ['/reports', 'Reports & notifications'],
]

export default function Sidebar() {
  const { pathname } = useRouter()
  const { signOut } = useSession()

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <strong>FreshFold</strong>
        <span>Admin panel</span>
      </div>
      <nav aria-label="Main">
        {LINKS.map(([path, label]) => (
          <Link key={path} to={path} aria-current={pathname === path ? 'page' : undefined}>
            {label}
          </Link>
        ))}
      </nav>
      <button type="button" className="sidebar__logout" onClick={signOut}>
        Log out
      </button>
    </aside>
  )
}
