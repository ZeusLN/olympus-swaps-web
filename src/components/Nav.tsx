import { A } from "@solidjs/router";
import { AiFillHome } from "solid-icons/ai";
import { OcLinkexternal2 } from "solid-icons/oc";
import { createSignal } from "solid-js";

import logo from "../assets/olympus-z-white.svg";
import { useGlobalContext } from "../context/Global";
import "../style/nav.scss";

const Nav = () => {
    const { t } = useGlobalContext();
    const [isMenuOpen, setIsMenuOpen] = createSignal(false);

    const closeMenu = () => setIsMenuOpen(false);

    return (
        <div class="navbar-container">
            <div class="logo-container">
                <A href="/" onClick={closeMenu}>
                    <img src={logo} height="30" alt="Swaps by ZEUS LSP" />
                    <p class="hide-on-mobile">Swaps by ZEUS LSP</p>
                </A>
            </div>

            <div class="desktop-nav-links">
                <A href="/swap">{t("swap")}</A>
                <div class="separator" />
                <A href="/rescue">{t("rescue")}</A>
                <div class="separator" />
                <A href="/history">{t("history")}</A>
                <div class="separator" />
                <A href="https://docs.zeusln.app/swaps/intro" target="_blank">
                    {t("documentation")}
                    <OcLinkexternal2 size={24} />
                </A>
            </div>

            <div class="desktop-home-icon">
                <A href="https://olympusln.com">
                    <AiFillHome size={25} color="white" />
                </A>
            </div>

            <div
                class={`hamburger-icon ${isMenuOpen() ? "active" : ""}`}
                onClick={() => setIsMenuOpen(!isMenuOpen())}>
                <div class="bar1"></div>
                <div class="bar2"></div>
                <div class="bar3"></div>
            </div>

            {isMenuOpen() && (
                <div class="mobile-nav-overlay">
                    <A href="/swap" onClick={closeMenu}>
                        {t("swap")}
                    </A>
                    <A href="/rescue" onClick={closeMenu}>
                        {t("rescue")}
                    </A>
                    <A href="/history" onClick={closeMenu}>
                        {t("history")}
                    </A>
                    <A
                        href="https://docs.zeusln.app/swaps/intro"
                        target="_blank"
                        onClick={closeMenu}>
                        {t("documentation")} <OcLinkexternal2 size={24} />
                    </A>
                    <A href="https://olympusln.com" onClick={closeMenu}>
                        <AiFillHome size={25} color="white" /> Home
                    </A>
                </div>
            )}
        </div>
    );
};

export default Nav;
