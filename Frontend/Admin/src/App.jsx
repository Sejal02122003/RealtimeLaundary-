import { Redirect, useRouter } from './routes/router.jsx'
import { useSession } from './context/session.jsx'
import Sidebar from './components/Sidebar.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Orders from './pages/Orders.jsx'
import Customers from './pages/Customers.jsx'
import Drivers from './pages/Drivers.jsx'
import Services from './pages/Services.jsx'
import Referrals from './pages/Referrals.jsx'
import Finance from './pages/Finance.jsx'
import Reports from './pages/Reports.jsx'

const ROUTES = {
  '/dashboard': Dashboard,
  '/orders': Orders,
  '/customers': Customers,
  '/drivers': Drivers,
  '/services': Services,
  '/referrals': Referrals,
  '/finance': Finance,
  '/reports': Reports,
}

export default function App() {
  const { pathname } = useRouter()
  const { token } = useSession()

  if (!token) return pathname === '/' ? <Login /> : <Redirect to="/" />

  const Page = ROUTES[pathname]
  if (!Page) return <Redirect to="/dashboard" />

  return (
    <div className="shell">
      <Sidebar />
      <main className="page">
        <Page key={pathname} />
      </main>
    </div>
  )
}
