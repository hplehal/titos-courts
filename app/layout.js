import { Inter } from 'next/font/google'
import './globals.css'
import NavMenu from './components/NavMenu'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Tito\'s Courts | TVL',
  description: 'Come to the world of Titos where everyone can come and enjoy the game!',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <NavMenu />
        {children}
      </body>
    </html>
  )
}
