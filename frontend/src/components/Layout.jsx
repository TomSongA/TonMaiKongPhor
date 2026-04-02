'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import './Layout.css'
import { Poppins } from 'next/font/google'
import './globals.css'

const nav = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/calendar', label: 'Data calendar' },
  { to: '/data', label: 'Data table' },
  { to: '/notifications', label: 'Notification' },
]

const poppins = Poppins({ 
  subsets: ['latin'], 
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins'
})

export default function Layout({ children }) {
  const pathname = usePathname()

  return (
    <div className={`app-shell ${poppins.className}`}>
      {/* <div className="app-shell"> */}
        <aside className="sidebar" aria-label="main">
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
              <Link
                key={item.to}
                href={item.to}
                className={
                  'sidebar-link' +
                  ((item.end ? pathname === item.to : pathname.startsWith(item.to))
                    ? ' sidebar-link--active'
                    : '')
                }
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <p className="sidebar-foot">
            Sample data: API connection available at: <code>src/lib</code>
          </p>
        </aside>
        <main className="main-panel">{children}</main>
      {/* </div> */}
    </div>
  )
}
