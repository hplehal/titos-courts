import Link from "next/link";

export default function NavMenu() {
    return(
      <nav className="nav">
        <h1 className="nav-header"><Link href={'/'}>${`Tito\'s Courts`}</Link></h1>
        <ul className="nav-menu">
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
      </nav>  
    );
}