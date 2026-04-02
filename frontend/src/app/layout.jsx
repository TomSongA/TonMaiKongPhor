import '../index.css'
import { Poppins } from 'next/font/google'

const poppins = Poppins({
  subsets: ['latin', 'thai'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  // Expose a global CSS variable so existing CSS can reference it.
  variable: '--font-poppins',
})

export const metadata = {
  title: 'TonMaiKongPhor - Plant Monitor',
  description: 'Plant dashboard with PSI, sensors, calendar, table, notifications',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={poppins.className}>{children}</body>
    </html>
  )
}
