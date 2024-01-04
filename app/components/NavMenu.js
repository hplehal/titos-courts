import Link from "next/link";
import Image from 'next/image'
import styles from './NavMenu.module.css'

export default function NavMenu() {
    return(
      <nav className= {styles.nav}>
        <h1 className={styles.nav_header}>
            <Link href={'/'}>
                <Image 
                 src="/titos.png"
                 alt="Titos Logo"
                 width={130}
                 height={40}
                 priority
                />
            </Link>
        </h1>
        <ul className={styles.nav_menu}>
            <li>
                <Link href={'/'}>Home</Link>
            </li>
            <li>
                <Link href={'/leagues'}>Leagues</Link>
            </li>
            <li>
                <Link href={'/register'}>Register</Link>
            </li>
        </ul>
      </nav>  
    );
}