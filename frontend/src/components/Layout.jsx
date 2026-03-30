import { NavLink, Outlet } from 'react-router-dom'
import './Layout.css'

const nav = [
  { to: '/', label: 'แดชบอร์ด', end: true },
  { to: '/calendar', label: 'ปฏิทินข้อมูล' },
  { to: '/data', label: 'ตารางข้อมูล' },
  { to: '/notifications', label: 'แจ้งเตือน' },
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
            <span className="sidebar-sub">มอนิเตอร์ต้นไม้</span>
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
          ข้อมูลตัวอย่าง — เชื่อม API ได้ที่ <code>src/lib</code>
        </p>
      </aside>
      <main className="main-panel">
        <Outlet />
      </main>
    </div>
  )
}
