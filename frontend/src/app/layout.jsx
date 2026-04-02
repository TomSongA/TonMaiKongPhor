import '../index.css'

export const metadata = {
  title: 'TonMaiKongPhor - Plant Monitor',
  description: 'Plant dashboard with PSI, sensors, calendar, table, notifications',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
