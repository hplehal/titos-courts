import Image from 'next/image'
import styles from './page.module.css'

export default function Home() {
  return (
    <main className={styles.main}>
      <Image
        src="/tvl.svg"
        alt="Titos Logo"
        width={500}
        height={200}
        priority
      />
    </main>
  )
}
