/* global lottie */
// Plays the loading screen animation while the main application bundle is
// being downloaded and evaluated. Served as a static asset (with the
// vendored lottie_light player) so it runs long before the app is ready.
// The overlay stays up until the app has mounted AND the animation has
// played at least one full cycle.
(() => {
    const overlay = document.getElementById("loading-overlay");
    const container = document.getElementById("loading-lottie");
    if (
        overlay === null ||
        container === null ||
        typeof lottie === "undefined"
    ) {
        return;
    }

    // The overlay is hidden by default so a failing script never blocks
    // the app; it only becomes visible once the animation can run
    overlay.hidden = false;

    const animation = lottie.loadAnimation({
        container,
        renderer: "svg",
        loop: true,
        autoplay: true,
        path: "/loading-columns.json",
        rendererSettings: {
            // Fill the full page width; crops vertically instead of
            // distorting the artwork
            preserveAspectRatio: "xMidYMid slice",
        },
    });

    animation.setSpeed(1.5);

    let cycleDone = false;
    // The app removes the loading class from body once it mounts
    let appReady = !document.body.classList.contains("loading");

    const finish = () => {
        if (!cycleDone || !appReady) {
            return;
        }
        overlay.classList.add("fade-out");
        window.setTimeout(() => {
            animation.destroy();
            overlay.remove();
        }, 450);
    };

    const completeCycle = () => {
        cycleDone = true;
        finish();
    };

    animation.addEventListener("loopComplete", completeCycle);
    animation.addEventListener("data_failed", completeCycle);
    // Never hold the app hostage if the animation stalls
    window.setTimeout(completeCycle, 10000);

    if (!appReady) {
        const observer = new MutationObserver(() => {
            if (!document.body.classList.contains("loading")) {
                observer.disconnect();
                appReady = true;
                finish();
            }
        });
        observer.observe(document.body, {
            attributes: true,
            attributeFilter: ["class"],
        });
    }
})();
