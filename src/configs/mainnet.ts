import { buildMainnetConfig } from "boltz-swaps/presets/mainnet";
import { type Config, baseConfig, chooseUrl } from "src/configs/base";
import { envRpcUrls } from "src/configs/rpcs";
import { usdt0CanSendOverrides } from "src/configs/usdt0";

const mainnetPreset = buildMainnetConfig({
    boltzApiUrl: "https://swaps.zeuslsp.com/api",
    rpcUrls: envRpcUrls,
    canSend: usdt0CanSendOverrides,
    btcMempoolApiUrl: import.meta.env.VITE_MEMPOOL_API_URL || undefined,
    // The SDK exposes the Arkade chain-swap source (asset id "ARK"), but the web
    // app has no Arkade wallet support yet, so keep it out of the app's asset
    // list (selector and `sendAsset`/`receiveAsset` URL params).
    filterAssets: (asset) => asset !== "ARK",
});

const config = {
    ...baseConfig,
    swapsSuspended: true,
    // ZEUS swaps only offers mainchain Bitcoin <-> Lightning
    defaultBitcoinOnly: true,
    // The ZEUS Lightning node does not support BOLT12 offers
    bolt12Supported: false,
    torUrl: "http://vsi7wnnknx2mlryo4mmehf5smfsiqy6kkzbkiu4pz7xaocvzceeccqyd.onion/",
    network: "mainnet",
    loglevel: "debug",
    apiUrl: {
        normal: "https://swaps.zeuslsp.com/api",
        tor: "http://vsi7wnnknx2mlryo4mmehf5smfsiqy6kkzbkiu4pz7xaocvzceeccqyd.onion/api",
    },
    cctpApiUrl: mainnetPreset.cctpApiUrl,
    solburnUrl: mainnetPreset.solburnUrl,
    assets: mainnetPreset.assets,
} as Config;

export { config, chooseUrl };
