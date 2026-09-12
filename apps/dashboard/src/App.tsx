import { BrowserRouter, Navigate, Route, Routes } from 'react-router'

import { LoginPage } from './features/auth/LoginPage'
import { RegisterPage } from './features/auth/RegisterPage'
import { ProtectedRoute } from './features/auth/ProtectedRoute'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { AddWebsitePage } from './features/websites/AddWebsitePage'
import { WebsiteDetailPage } from './features/websites/WebsiteDetailPage'
import { ModelPage } from './features/model/ModelPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/websites/new" element={<ProtectedRoute><AddWebsitePage /></ProtectedRoute>} />
        <Route path="/websites/:id" element={<ProtectedRoute><WebsiteDetailPage /></ProtectedRoute>} />
        <Route path="/model" element={<ProtectedRoute><ModelPage /></ProtectedRoute>} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
