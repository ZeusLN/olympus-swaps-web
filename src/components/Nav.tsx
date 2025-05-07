import { A } from "@solidjs/router";
import { AiFillHome } from "solid-icons/ai";

import logo from "../assets/olympus-z-white.svg";

const Nav = () => {
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
