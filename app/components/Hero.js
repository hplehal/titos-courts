import Link from "next/link";
import Image from 'next/image';
import styles from './Hero.module.css';

export default function Hero() {
    return(
      <section className={styles.section}>
        <h1>Winter Season</h1>
        <div>
            <p>Our Winter Season starts January 9th!</p>
            <p>The Best Adult COED Volleyball League in Mississauga</p>
        </div>
        <Link href={'/register'} passHref><button component="a">Register</button></Link>
        
      </section>
    );
}