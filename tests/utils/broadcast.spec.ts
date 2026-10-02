import { broadcastApiTransaction } from "boltz-swaps/client";
import { vi } from "vitest";

import { BTC } from "../../src/consts/Assets";
import {
    broadcastTransaction,
    parseExplorerRejection,
} from "../../src/utils/blockchain";

vi.mock("boltz-swaps/client", () => ({
    broadcastApiTransaction: vi.fn(),
}));

const mockBroadcastApiTransaction = vi.mocked(broadcastApiTransaction);

const textResponse = (status: number, body: string) =>
    ({
        ok: status >= 200 && status < 300,
        status,
        url: "https://explorer.example/api/tx",
        headers: { get: () => "text/plain" },
        text: () => Promise.resolve(body),
    }) as unknown as Response;

describe("parseExplorerRejection", () => {
    test.each`
        format       | message                                                                                  | expected
        ${"mempool"} | ${'HTTP 400 from x: sendrawtransaction RPC error: {"code":-26,"message":"non-final"}'}   | ${"non-final"}
        ${"esplora"} | ${"HTTP 400 from x: sendrawtransaction RPC error -26: non-final"}                        | ${"non-final"}
        ${"esplora"} | ${"HTTP 400 from x: sendrawtransaction RPC error -25: bad-txns-inputs-missingorspent\n"} | ${"bad-txns-inputs-missingorspent"}
        ${"none"}    | ${"HTTP 502 from x"}                                                                     | ${undefined}
    `(
        "should parse the $format format of $message",
        ({ message, expected }) => {
            expect(parseExplorerRejection(message)).toEqual(expected);
        },
    );
});

describe("broadcastTransaction", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test("should return the backend result when the explorer fails", async () => {
        mockBroadcastApiTransaction.mockResolvedValue({ id: "txid" });
        global.fetch = vi.fn(() =>
            Promise.resolve(textResponse(502, "")),
        ) as typeof fetch;

        await expect(broadcastTransaction(BTC, "00")).resolves.toEqual({
            id: "txid",
        });
    });

    test("should throw the explorer rejection when the backend is unavailable", async () => {
        mockBroadcastApiTransaction.mockRejectedValue(
            "could not find currency: BTC",
        );
        global.fetch = vi.fn(() =>
            Promise.resolve(
                textResponse(
                    400,
                    'sendrawtransaction RPC error: {"code":-26,"message":"non-final"}',
                ),
            ),
        ) as typeof fetch;

        await expect(broadcastTransaction(BTC, "00")).rejects.toEqual(
            "non-final",
        );
    });

    test("should throw the backend error when the explorer gives no rejection", async () => {
        mockBroadcastApiTransaction.mockRejectedValue("non-final");
        global.fetch = vi.fn(() =>
            Promise.reject(new Error("network down")),
        ) as typeof fetch;

        await expect(broadcastTransaction(BTC, "00")).rejects.toEqual(
            "non-final",
        );
    });
});
