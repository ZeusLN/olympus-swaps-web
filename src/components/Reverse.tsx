import { ImArrowDown2 } from "solid-icons/im";

import { useCreateContext } from "../context/Create";

const Reverse = () => {
    const {
        assetReceive,
        assetSend,
        setAssetSend,
        setAssetReceive,
        setOnchainAddress,
    } = useCreateContext();
    const setDirection = () => {
        setOnchainAddress("");
        const sendOld = assetSend();
        setAssetSend(assetReceive());
        setAssetReceive(sendOld);
    };

    return (
        <div id="flip-assets" onClick={() => setDirection()}>
            <ImArrowDown2 size={14} />
        </div>
    );
};

export default Reverse;
