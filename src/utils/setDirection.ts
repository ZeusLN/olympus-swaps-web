import { Side } from "../consts/Enums";
import { useCreateContext } from "../context/Create";
import { useGlobalContext } from "../context/Global";
import Pair from "./Pair";
import { getDecimals } from "./denomination";

// Swaps the send and receive assets of the current pair; used by the flip
// arrow and, in bitcoin-only mode, by the asset buttons themselves
export const useSetDirection = () => {
    const { pairs, regularPairs } = useGlobalContext();
    const {
        pair,
        setPair,
        setOnchainAddress,
        setInvoice,
        sendAmount,
        setSendAmount,
        receiveAmount,
        setReceiveAmount,
        amountChanged,
        setAmountChanged,
        destinationLocked,
    } = useCreateContext();

    return () => {
        const fromErc20 = getDecimals(pair().fromAsset).isErc20;
        const toErc20 = getDecimals(pair().toAsset).isErc20;

        if (fromErc20 || toErc20) {
            const prevSend = sendAmount();
            const prevReceive = receiveAmount();
            setSendAmount(prevReceive);
            setReceiveAmount(prevSend);
            setAmountChanged(
                amountChanged() === Side.Send ? Side.Receive : Side.Send,
            );
        }

        setOnchainAddress("");
        if (!destinationLocked()) {
            setInvoice("");
        }
        setPair(
            new Pair(pairs(), pair().toAsset, pair().fromAsset, regularPairs()),
        );
    };
};
