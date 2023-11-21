import Image from 'next/image'
import styles from './page.module.css'
import Hero from './components/Hero'

export default function Home() {
  return (
    <main className={styles.main}>
      <Image 
        src="/titos.png"
        alt="Titos Logo"
        width={400}
        height={200}
        priority
      />
      <h2>COMING SOON</h2>
    </main>
  )
}
