import '../css/header.css';
import fit_icon from "../assets/fit_icon.png";
import {NavLink} from "react-router";


function Header() {
    return (
        <header>
        <span className="logo">
            <NavLink to={"/"}><img alt="FIT logo" src={fit_icon}/>&nbsp;& JunkoTeam</NavLink></span>
            <nav className="navbar_header">
                <ul>
                    <li><NavLink to={"/login"}>Login</NavLink></li>
                </ul>
            </nav>
        </header>
    )
}

export default Header;
