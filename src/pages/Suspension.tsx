import { For } from "solid-js";

import { useGlobalContext } from "../context/Global";
import "../style/suspension.scss";

const paragraphs = [
    "suspension_p1",
    "suspension_p2",
    "suspension_p3",
    "suspension_p4",
    "suspension_p5",
    "suspension_p6",
] as const;

export const Suspension = () => {
    const { t } = useGlobalContext();

    return (
        <div id="suspension">
            <span class="status">
                <span class="dot" />
                {t("suspension_status")}
            </span>

            <div class="notice">
                <For each={paragraphs}>{(key) => <p>{t(key)}</p>}</For>

                <div class="notice-date">{t("suspension_date")}</div>
            </div>
        </div>
    );
};

export default Suspension;
