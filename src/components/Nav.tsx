import { A } from "@solidjs/router";
import { AiFillHome } from "solid-icons/ai";
import { OcLinkexternal2 } from "solid-icons/oc";

import logo from "../assets/olympus-z-white.svg";
import { useGlobalContext } from "../context/Global";

const Nav = () => {
    const { t } = useGlobalContext();

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
            }}>
            <div
                style={{
                    position: "absolute",
                    left: "10px",
                    top: "10px",
                    display: "flex",
                    "align-items": "center",
                }}>
                <A
                    href="/"
                    style={{
                        "text-decoration": "none",
                        color: "inherit",
                        display: "flex",
                        "align-items": "center",
                    }}>
                    <img
                        src={logo}
                        height="30"
                        alt="Swaps by ZEUS LSP"
                        style={{ "margin-right": "8px" }}
                    />
                    <p
                        class="hide-on-mobile"
                        style={{
                            "font-size": "18px",
                            margin: 0,
                            color: "#fff",
                        }}>
                        Swaps by ZEUS LSP
                    </p>
                </A>
            </div>

            <div
                style={{
                    padding: "16px 0",
                    display: "flex",
                    "align-items": "center",
                    "justify-content": "center",
                    gap: "16px",
                }}>
                <A
                    href="/swap"
                    style={{
                        color: "#fff",
                        "text-decoration": "none",
                        "font-size": "18px",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.color = "yellow";
                        e.currentTarget.style.textDecoration = "underline";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.color = "#fff";
                        e.currentTarget.style.textDecoration = "none";
                    }}>
                    {t("swap")}
                </A>

                <div
                    style={{
                        width: "1px",
                        height: "20px",
                        "background-color": "#fff",
                    }}
                />
                <A
                    href="/rescue"
                    style={{
                        color: "#fff",
                        "text-decoration": "none",
                        "font-size": "18px",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.color = "#efc22b";
                        e.currentTarget.style.textDecoration = "underline";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.color = "#fff";
                        e.currentTarget.style.textDecoration = "none";
                    }}>
                    {t("rescue")}
                </A>

                <div
                    style={{
                        width: "1px",
                        height: "20px",
                        "background-color": "#fff",
                    }}
                />
                <A
                    href="/history"
                    style={{
                        color: "#fff",
                        "text-decoration": "none",
                        "font-size": "18px",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.color = "yellow";
                        e.currentTarget.style.textDecoration = "underline";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.color = "#fff";
                        e.currentTarget.style.textDecoration = "none";
                    }}>
                    {t("history")}
                </A>
                <div
                    style={{
                        width: "1px",
                        height: "20px",
                        "background-color": "#fff",
                    }}
                />
                <A
                    href="https://docs.zeusln.app/swaps/intro"
                    class="external"
                    target="_blank"
                    style={{
                        color: "#fff",
                        "text-decoration": "none",
                        "font-size": "18px",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.color = "yellow";
                        e.currentTarget.style.textDecoration = "underline";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.color = "#fff";
                        e.currentTarget.style.textDecoration = "none";
                    }}>
                    {t("documentation")}
                    <OcLinkexternal2 size={24} />
                </A>
            </div>

            <div style={{ position: "absolute", right: 0, top: 0 }}>
                <A
                    href="https://olympusln.com"
                    style={{
                        "text-decoration": "none",
                        color: "inherit",
                        padding: "10px",
                        display: "flex",
                        "align-items": "center",
                        "justify-content": "center",
                    }}>
                    <AiFillHome size={25} color="white" />
                </A>
            </div>
        </div>
    );
};

export default Nav;
