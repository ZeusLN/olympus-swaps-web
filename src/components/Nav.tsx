import { A } from "@solidjs/router";
import { AiOutlineHome } from "solid-icons/ai";

import logo from "../assets/olympus-z-white.svg";

const Nav = () => {
    return (
        <div class="nav-container">
            <A id="logo" href="/" class="nav-left">
                <img src={logo} alt="Olympus by ZEUS logo" class="logo-small" />
                <p>Olympus by ZEUS LSP</p>
            </A>

            <A href="https://olympusln.com" class="nav-right">
                <AiOutlineHome size={24} color="white" />
            </A>
        </div>
    );
};

export default Nav;
