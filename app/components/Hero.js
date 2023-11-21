import Link from "next/link";
import Image from 'next/image';
import styles from './Hero.module.css';

export default function Hero() {
    return(
      <section className={styles.section}>
        <h1>Register Now</h1>
        <p>We are now open for registration on our Winter Season!</p>
        <Link href={'/register'} passHref><button component="a">Register</button></Link>
        
      </section>
    );
}