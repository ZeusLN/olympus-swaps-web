import { buildMainnetConfig } from "boltz-swaps/presets/mainnet";
import { type Config, baseConfig, chooseUrl } from "src/configs/base";

const mainnetPreset = buildMainnetConfig({
    boltzApiUrl: "https://swaps.zeuslsp.com/api",
    btcMempoolApiUrl: import.meta.env.VITE_MEMPOOL_API_URL || undefined,
    // ZEUS swaps only supports mainchain Bitcoin <-> Lightning
    filterAssets: (asset) => asset === "BTC",
});

const config = {
    ...baseConfig,
    torUrl: "http://vsi7wnnknx2mlryo4mmehf5smfsiqy6kkzbkiu4pz7xaocvzceeccqyd.onion/",
    network: "mainnet",
    loglevel: "debug",
    apiUrl: {
        normal: "https://swaps.zeuslsp.com/api",
        tor: "http://vsi7wnnknx2mlryo4mmehf5smfsiqy6kkzbkiu4pz7xaocvzceeccqyd.onion/api",
    },
    assets: mainnetPreset.assets,
} as Config;

export { config, chooseUrl };
