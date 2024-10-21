import Link from "next/link";
import Image from 'next/image';
import { Splide, SplideSlide } from '@splidejs/react-splide';
import styles from './Featured.module.css';
import '@splidejs/react-splide/css';

export default function Featured() {
  const teams = ['hamchoi', 'hisym', 'jujutsuspikesen', 'laangels', 'lefthand', 'nbn', 'onlyfrans', 'ouubae', 'samsclub', 'serveivor', 'shrek5', 'skg', 'spam', 'stepkuya', 'strawhats', 'tippics', 'wufang', 'wwfs'];
    return(
      <section className={styles.section}>
        <h3><a><Image 
            src="/tvl.svg"
            alt="Titos Volleyball Logo"
            width={100}
            height={100}
            priority
        /></a>
        {"TITO'S VOLLEYBALL LEAGUE"}
        <a><Image 
            src="/tvl.svg"
            alt="Titos Volleyball Logo"
            width={100}
            height={100}
            priority
        /></a></h3>
        {/* <Splide  options={ {
            rewind : true,
            perPage: 6,
            height : '90px',
            gap    : '.5rem',
            pagination : false
          } }>
            {teams.map((item, index) => {
              return (
                <SplideSlide key={index}>
                  <a><Image 
                      src={`/season2Teams/${item}.png`}
                      alt="Titos Volleyball Logo"
                      width={150}
                      height={90}
                      priority
                  /></a>
                </SplideSlide>
              )
            })}
        </Splide> */}
      </section>
    );
}