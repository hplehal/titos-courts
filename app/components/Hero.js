import Link from "next/link";
import Image from 'next/image';
import styles from './Hero.module.css';

export default function Hero() {
    return(
      <section className={styles.section}>
        <h1>Register Now</h1>
        <div>
            <p>Our Winter Season Registration is now open!</p>
            <p>The Best COED Volleyball League in Mississauga</p>
        </div>
        <Link href={'/register'} passHref><button component="a">Register</button></Link>
        
      </section>
    );
}