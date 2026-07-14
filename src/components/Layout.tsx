import {
  BarChart3,
  LogOut,
  Menu,
  Moon,
  PlusCircle,
  Receipt,
  Sun,
  X,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useTheme } from '../context/ThemeContext'
import { AiChat } from './AiChat'

const NAV = [
  { path: '/analise', label: 'Análise', icon: BarChart3 },
  { path: '/lancamentos', label: 'Lançamentos', icon: PlusCircle },
  { path: '/despesas', label: 'Despesas fixas', icon: Receipt },
]

const TITLES: Record<string, string> = {
  '/analise': 'Análise financeira',
  '/lancamentos': 'Lançamentos',
  '/despesas': 'Despesas fixas',
}

export function Layout({ children }: { children: ReactNode }) {
  const { usuario, logout, navigateWithLoading } = useApp()
  const { theme, toggle } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const go = (path: string) => {
    if (path === location.pathname) {
      setMenuOpen(false)
      return
    }
    setMenuOpen(false)
    navigateWithLoading(() => navigate(path))
  }

  const handleLogout = () => {
    navigateWithLoading(() => {
      logout()
      navigate('/login')
    })
  }

  return (
    <div className="app-shell">
      <div
        className={`sidebar-overlay${menuOpen ? ' visible' : ''}`}
        onClick={() => setMenuOpen(false)}
      />

      <aside className={`sidebar${menuOpen ? ' open' : ''}`}>
        <div className="sidebar-brand">
          <img src="/logo.png" alt="Glazia" />
          <div className="sidebar-brand-text">
            <strong>GLAZIA</strong>
            <span>Financeiro</span>
          </div>
          <button
            className="btn-icon"
            style={{ marginLeft: 'auto', display: 'none' }}
            onClick={() => setMenuOpen(false)}
            aria-label="Fechar menu"
            id="close-mobile-menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="nav-list">
          {NAV.map(({ path, label, icon: Icon }) => (
            <button
              key={path}
              className={`nav-item${location.pathname === path ? ' active' : ''}`}
              onClick={() => go(path)}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-chip" style={{ padding: '0.35rem 0.5rem' }}>
            <div className="user-avatar">{usuario?.nome?.charAt(0) ?? 'U'}</div>
            <div>
              <div style={{ color: 'var(--text)', fontWeight: 600 }}>{usuario?.nome}</div>
              <div style={{ fontSize: '0.72rem' }}>{usuario?.email}</div>
            </div>
          </div>
          <button className="nav-item" onClick={handleLogout}>
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="menu-btn"
              onClick={() => setMenuOpen(true)}
              aria-label="Abrir menu"
            >
              <Menu size={20} />
            </button>
            <img src="/logo.png" alt="" className="mobile-logo" />
            <h1>{TITLES[location.pathname] ?? 'Glazia'}</h1>
          </div>
          <div className="topbar-actions">
            <button
              className="btn-icon"
              onClick={toggle}
              aria-label="Alternar tema"
              title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>
        <main className="page-content">{children}</main>
      </div>
      <AiChat />
    </div>
  )
}
