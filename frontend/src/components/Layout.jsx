import { NavLink, Outlet } from 'react-router-dom'
import './Layout.css'

const nav = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/calendar', label: 'Data calendar' },
  { to: '/data', label: 'Data table' },
  { to: '/notifications', label: 'Notification' },
]

export default function Layout() {
  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="เมนูหลัก">
        <div className="sidebar-brand">
          <span className="sidebar-logo" aria-hidden>
            🌱
          </span>
          <div>
            <strong>TonMaiKongPhor</strong>
            <span className="sidebar-sub">Tree monitor</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                'sidebar-link' + (isActive ? ' sidebar-link--active' : '')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <p className="sidebar-foot">
          Sample data: API connection available at: <code>src/lib</code>
        </p>
      </aside>
      <main className="main-panel">
        <Outlet />
      </main>
    </div>
  )
}
