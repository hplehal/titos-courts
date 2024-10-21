'use client'
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
        <h3>Be Part of the Community!</h3>
        <a href="https://www.instagram.com/titoscourts?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==">Follow Us!</a>
      </section>
    </main>
  )
}