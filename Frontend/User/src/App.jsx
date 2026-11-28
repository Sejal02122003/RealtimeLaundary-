import { Redirect, useRouter } from './routes/router.jsx'
import { useStore } from './context/store.jsx'
import TabBar, { TABS } from './components/TabBar.jsx'
import Welcome from './pages/Welcome.jsx'
import SignIn from './pages/SignIn.jsx'
import Verify from './pages/Verify.jsx'
import Home from './pages/Home.jsx'
import Items from './pages/Items.jsx'
import Schedule from './pages/Schedule.jsx'
import Review from './pages/Review.jsx'
import Orders from './pages/Orders.jsx'
import OrderDetail from './pages/OrderDetail.jsx'
import Refer from './pages/Refer.jsx'
import Wallet from './pages/Wallet.jsx'
import Account from './pages/Account.jsx'

const PUBLIC_ROUTES = {
  '/': Welcome,
  '/signin': SignIn,
  '/signup': SignIn,
  '/verify': Verify,
}

const PRIVATE_ROUTES = {
  '/home': Home,
  '/items': Items,
  '/schedule': Schedule,
  '/review': Review,
  '/orders': Orders,
  '/refer': Refer,
  '/wallet': Wallet,
  '/account': Account,
}

export default function App() {
  const { pathname } = useRouter()
  const { session } = useStore()

  const orderId = pathname.match(/^\/orders\/([\w-]+)$/)?.[1]
  const Page = orderId
    ? OrderDetail
    : (PRIVATE_ROUTES[pathname] ?? PUBLIC_ROUTES[pathname])

  if (!Page) return <Redirect to={session ? '/home' : '/'} />
  const isPublic = pathname in PUBLIC_ROUTES
  if (session && isPublic) return <Redirect to="/home" />
  if (!session && !isPublic) return <Redirect to="/" />

  return (
    <div className="app">
      <Page key={pathname} orderId={orderId} />
      {TABS.some((tab) => tab.path === pathname) && <TabBar />}
    </div>
  )
}
