import Link from "next/link";
import Image from 'next/image';
import styles from './Hero.module.css';

export default function Hero() {
    return(
      <section className={styles.section}>
        <h1>Titos Volleyball League</h1>
        <div>
            <p>Be Part of something Bigger!</p>
            <p>The Best Adult Volleyball League in the GTA!</p>
        </div>
        <Link href={'/register'} passHref><button component="a">Register</button></Link>
      </section>
    );
}