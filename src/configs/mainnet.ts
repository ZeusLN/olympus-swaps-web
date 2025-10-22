import type { Config } from "src/configs/base";
import { baseConfig, chooseUrl } from "src/configs/base";

const config = {
    ...baseConfig,
    torUrl: "http://vsi7wnnknx2mlryo4mmehf5smfsiqy6kkzbkiu4pz7xaocvzceeccqyd.onion/",
    network: "mainnet",
    loglevel: "debug",
    apiUrl: {
        normal: "https://swaps.zeuslsp.com/api",
        tor: "http://vsi7wnnknx2mlryo4mmehf5smfsiqy6kkzbkiu4pz7xaocvzceeccqyd.onion/api",
    },
    assets: {
        BTC: {
            blockExplorerUrl: {
                normal: "https://mempool.space",
                tor: "http://mempoolhqx4isw62xs7abwphsq7ldayuidyx2v2oethdhhj6mlo2r6ad.onion",
            },
            blockExplorerApis: [
                {
                    normal: "https://blockstream.info/api",
                    tor: "http://explorerzydxu5ecjrkwceayqybizmpjjznk5izmitf2modhcusuqlid.onion/api",
                },
                {
                    normal: "https://mempool.space/api",
                    tor: "http://mempoolhqx4isw62xs7abwphsq7ldayuidyx2v2oethdhhj6mlo2r6ad.onion/api",
                },
            ],
        },
    },
} as Config;

export { config, chooseUrl };
