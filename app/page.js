import Image from 'next/image'
import styles from './page.module.css'
import Hero from './components/Hero'
import Featured from './components/Featured'

export default function Home() {
  return (
    <main className={styles.main}>
      <Hero/>
      <Featured />
      <section className={styles.shop}>
        <h3>Shop Coming Soon</h3>
      </section>
    </main>
  )
}
