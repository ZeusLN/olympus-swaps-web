import { render, screen } from "@solidjs/testing-library";

import RescueSupportNotice from "../../src/components/RescueSupportNotice";
import { config } from "../../src/config";
import i18n from "../../src/i18n/i18n";
import { contextWrapper } from "../helper";

describe("RescueSupportNotice", () => {
    const swapsSuspended = config.swapsSuspended;

    afterEach(() => {
        config.swapsSuspended = swapsSuspended;
    });

    test("should show the support notice when swaps are suspended", () => {
        config.swapsSuspended = true;

        render(() => <RescueSupportNotice />, { wrapper: contextWrapper });

        expect(screen.getByTestId("rescueSupportNotice")).toHaveTextContent(
            i18n.en.rescue_support_notice,
        );
    });

    test("should not show the support notice when swaps are live", () => {
        config.swapsSuspended = false;

        render(() => <RescueSupportNotice />, { wrapper: contextWrapper });

        expect(screen.queryByTestId("rescueSupportNotice")).toBeNull();
    });
});
