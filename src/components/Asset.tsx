import { IoChevronDown } from "solid-icons/io";
import type { Accessor } from "solid-js";

import { getAssetDisplaySymbol, getNetworkBadge } from "../consts/Assets";
import { AssetSelection, type Side } from "../consts/Enums";
import { useCreateContext } from "../context/Create";
import { useGlobalContext } from "../context/Global";
import "../style/asset.scss";
import { useSetDirection } from "../utils/setDirection";

const Asset = (props: {
    side: Side;
    signal: Accessor<string>;
    disabled?: boolean;
}) => {
    const { bitcoinOnly } = useGlobalContext();
    const setDirection = useSetDirection();

    const openSelect = () => {
        if (props.disabled) {
            return;
        }
        // With only two assets there is nothing to select; flip the
        // direction instead, like the arrow between the asset rows
        if (bitcoinOnly()) {
            setDirection();
            return;
        }
        setAssetSelected(props.side);
        setAssetSelection(AssetSelection.Asset);
    };

    const { setAssetSelected, setAssetSelection } = useCreateContext();

    return (
        <button
            type="button"
            disabled={props.disabled}
            class={`asset-wrap${
                bitcoinOnly() || props.disabled ? " no-select" : ""
            }${bitcoinOnly() && !props.disabled ? " flippable" : ""}`}
            onClick={openSelect}>
            <div
                data-testid={`asset-${props.side}`}
                class={`asset asset-${getAssetDisplaySymbol(props.signal())}`}
                data-network={getNetworkBadge(props.signal())}>
                <div class="asset-selection">
                    <span class="icon" />
                    <span class="asset-text" />
                    <IoChevronDown class="arrow-down" aria-hidden="true" />
                </div>
            </div>
        </button>
    );
};

export default Asset;
