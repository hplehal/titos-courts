import Link from "next/link";
import Image from 'next/image';
import styles from './Footer.module.css';

export default function Footer() {
    return(
      <section className={styles.section}>
         <ul className={styles.nav_menu}>
            <li>
                <Link href={'/'}>Home</Link>
            </li>
            <li>
                <Link href={'/league'}>League</Link>
            </li>
            <li>
                <Link href={'/register'}>Register</Link>
            </li>
        </ul>
        <Image 
            src="/titos.png"
            alt="Titos Logo"
            width={300}
            height={150}
            priority
        />
        <div>
            
        </div>
        
      </section>
    );
}