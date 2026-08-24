import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

import PageLoader from './PageLoader'

export default function ProtectedRoute({ role, children }) {
  const { role: currentRole, booting } = useAuth()
  if (booting) {
    return <PageLoader fullScreen />
  }
  if (!currentRole) return <Navigate to="/login" replace />
  if (currentRole !== role) {
    const target = currentRole === 'admin' ? '/admin' : currentRole === 'user' ? '/app' : '/login'
    return <Navigate to={target} replace />
  }
  return children
}
