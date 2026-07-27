import { ImArrowDown2 } from "solid-icons/im";

import { useSetDirection } from "../utils/setDirection";

const Reverse = () => {
    const setDirection = useSetDirection();

    return (
        <button id="flip-assets" onClick={() => setDirection()}>
            <ImArrowDown2 size={14} />
        </button>
    );
};

export default Reverse;
