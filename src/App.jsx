import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import { NetworkProvider } from './components/NetworkContext.jsx'
import { WalletProvider } from './components/WalletContext.jsx'
import Docs from './pages/Docs.jsx'
import Home from './pages/Home.jsx'
import Roadmap from './pages/Roadmap.jsx'
import Security from './pages/Security.jsx'
import Seed from './pages/Seed.jsx'
import Status from './pages/Status.jsx'
import Workspace from './pages/Workspace.jsx'
import './App.css'

export default function App() {
  return (
    <BrowserRouter>
      <NetworkProvider>
        <WalletProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="app" element={<Workspace />} />
              <Route path="create" element={<Navigate to="/app" replace />} />
              <Route path="claim" element={<Navigate to="/app" replace />} />
              <Route path="about" element={<Navigate to="/docs" replace />} />
              <Route path="docs" element={<Docs />} />
              <Route path="security" element={<Security />} />
              <Route path="status" element={<Status />} />
              <Route path="roadmap" element={<Roadmap />} />
              <Route path="seed" element={<Seed />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </WalletProvider>
      </NetworkProvider>
    </BrowserRouter>
  )
}
