import { Redirect, useRouter } from './routes/router.jsx'
import { useSession } from './context/session.jsx'
import TabBar, { TAB_PATHS } from './components/TabBar.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Jobs from './pages/Jobs.jsx'
import JobDetail from './pages/JobDetail.jsx'
import History from './pages/History.jsx'
import Profile from './pages/Profile.jsx'

const PUBLIC_ROUTES = { '/': Login, '/register': Register }
const PRIVATE_ROUTES = { '/jobs': Jobs, '/history': History, '/profile': Profile }

export default function App() {
  const { pathname } = useRouter()
  const { token } = useSession()

  const jobId = pathname.match(/^\/jobs\/([\w-]+)$/)?.[1]
  const Page = jobId ? JobDetail : (PRIVATE_ROUTES[pathname] ?? PUBLIC_ROUTES[pathname])

  if (!Page) return <Redirect to={token ? '/jobs' : '/'} />
  const isPublic = pathname in PUBLIC_ROUTES
  if (token && isPublic) return <Redirect to="/jobs" />
  if (!token && !isPublic) return <Redirect to="/" />

  return (
    <div className="app">
      <Page key={pathname} jobId={jobId} />
      {TAB_PATHS.includes(pathname) && <TabBar />}
    </div>
  )
}
