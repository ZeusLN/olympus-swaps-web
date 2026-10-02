import { BsInfoCircleFill } from "solid-icons/bs";
import { Show } from "solid-js";

import { config } from "../config";
import { useGlobalContext } from "../context/Global";
import "../style/rescueSupportNotice.scss";

// While swaps are suspended the backend only serves swap lookups, so claims
// and anything the page cannot find have to go through support
const RescueSupportNotice = () => {
    const { t } = useGlobalContext();

    return (
        <Show when={config.swapsSuspended}>
            <p class="rescue-support-notice" data-testid="rescueSupportNotice">
                <BsInfoCircleFill size={14} />
                {t("rescue_support_notice")}
            </p>
        </Show>
    );
};

export default RescueSupportNotice;
