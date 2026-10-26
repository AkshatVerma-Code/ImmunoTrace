import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Landing from './pages/Landing'
import Records from './pages/Records'
import Upload from './pages/Upload'
import ReviewDocument from './pages/ReviewDocument'
import Summary from './pages/Summary'
import Assistant from './pages/Assistant'
import Wellness from './pages/Wellness'
import Profile from './pages/Profile'
import { authApi } from './services/api'

function GuestOnly({ children }: { children: ReactNode }) {
  const [signedIn, setSignedIn] = useState<boolean | null>(null)
  useEffect(() => { authApi.me().then(() => setSignedIn(true)).catch(() => setSignedIn(false)) }, [])
  if (signedIn === null) return <div className="app-loading"><span>Checking your session…</span></div>
  return signedIn ? <Navigate to="/dashboard" replace /> : children
}

export default function App() {
  return <Routes>
    <Route path="/" element={<Landing />} />
    <Route path="/login" element={<GuestOnly><Auth mode="login" /></GuestOnly>} />
    <Route path="/register" element={<GuestOnly><Auth mode="register" /></GuestOnly>} />
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/records" element={<Dashboard><Records /></Dashboard>} />
    <Route path="/upload" element={<Dashboard><Upload /></Dashboard>} />
    <Route path="/records/:id/review" element={<Dashboard><ReviewDocument /></Dashboard>} />
    <Route path="/summary" element={<Dashboard><Summary /></Dashboard>} />
    <Route path="/assistant" element={<Dashboard><Assistant /></Dashboard>} />
    <Route path="/wellness" element={<Dashboard><Wellness /></Dashboard>} />
    <Route path="/profile" element={<Dashboard><Profile /></Dashboard>} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
}
