import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthGate } from './components/AuthGate'
import { AppLayout } from './components/layout/AppLayout'
import { Dashboard } from './pages/Dashboard'
import { Transactions } from './pages/Transactions'
import { RecurringPage } from './pages/RecurringPage'
import { Wallets } from './pages/Wallets'
import { Categories } from './pages/Categories'
import { Stats } from './pages/Stats'
import { Settings } from './pages/Settings'

export default function App() {
  return (
    <AuthGate>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="movimientos" element={<Transactions />} />
          <Route path="fijos" element={<RecurringPage />} />
          <Route path="billeteras" element={<Wallets />} />
          <Route path="categorias" element={<Categories />} />
          <Route path="estadisticas" element={<Stats />} />
          <Route path="ajustes" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </AuthGate>
  )
}
